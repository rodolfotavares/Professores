import { createHash, randomBytes } from 'crypto';
import { supabaseAdmin } from './supabase-admin';

type TelegramUser = {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  username?: string;
};

type TelegramMessage = {
  message_id: number;
  text?: string;
  chat: { id: number; type: string };
  from?: TelegramUser;
};

type BotConnection = {
  id: string;
  teacher_id: string;
  telegram_user_id: string | null;
  telegram_username: string | null;
  telegram_first_name: string | null;
  telegram_chat_id: string | null;
  connection_code: string;
  code_expires_at: string;
  pending_action: PendingAction | null;
};

type TokenValidationResult =
  | { ok: true; connection: BotConnection }
  | { ok: false; reason: 'invalid' | 'expired' | 'used' };

type StudentMatch = {
  id: string;
  full_name: string;
  subject: string | null;
  user_id: string | null;
  price_per_class?: number | null;
};

type PendingAction =
  | { type: 'CREATE_CLASS'; student_id: string; student_name: string; class_date: string; class_time: string; subject: string | null }
  | { type: 'REGISTER_PAYMENT'; student_id: string; student_name: string; amount: number; month_reference: string; student_user_id: string | null }
  | { type: 'REGISTER_ABSENCE'; student_id: string; student_name: string; class_date: string }
  | { type: 'CREATE_NOTE'; student_id: string; student_name: string; note: string };

type ParsedIntent =
  | { type: 'HELP' }
  | { type: 'AGENDA'; date: string }
  | { type: 'LIST_STUDENTS' }
  | { type: 'PENDING' }
  | { type: 'COUNT_STUDENTS' }
  | { type: 'FINANCIAL_REPORT' }
  | { type: 'CREATE_CLASS'; studentName: string; date: string; time: string }
  | { type: 'REGISTER_PAYMENT'; studentName: string; amount: number }
  | { type: 'REGISTER_ABSENCE'; studentName: string; date: string }
  | { type: 'CREATE_NOTE'; studentName: string; note: string }
  | { type: 'UNKNOWN' };

function token() {
  const value = process.env.TELEGRAM_BOT_TOKEN;
  if (!value) throw new Error('TELEGRAM_BOT_TOKEN nao configurado.');
  return value;
}

export function expectedTelegramSecret() {
  return process.env.TELEGRAM_WEBHOOK_SECRET || '';
}

export function botUsername() {
  return process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || process.env.TELEGRAM_BOT_USERNAME || '';
}

function hashConnectToken(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export async function createTelegramConnectToken(teacherId: string) {
  const rawToken = randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await supabaseAdmin.from('telegram_bot_connection_tokens').insert({
    teacher_id: teacherId,
    token_hash: hashConnectToken(rawToken),
    expires_at: expiresAt,
  });
  if (error) throw error;

  return { token: rawToken, expires_at: expiresAt };
}

async function consumeTelegramConnectToken(rawToken: string, message: TelegramMessage): Promise<TokenValidationResult> {
  if (!message.from) return { ok: false, reason: 'invalid' };

  const now = new Date().toISOString();
  const tokenHash = hashConnectToken(rawToken);
  const { data: tokenRow, error: tokenError } = await supabaseAdmin
    .from('telegram_bot_connection_tokens')
    .select('id, teacher_id, expires_at, used_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (tokenError || !tokenRow) return { ok: false, reason: 'invalid' };
  if (tokenRow.used_at) return { ok: false, reason: 'used' };
  if (new Date(tokenRow.expires_at).getTime() <= Date.now()) return { ok: false, reason: 'expired' };

  const { data: existing } = await supabaseAdmin
    .from('telegram_bot_connections')
    .select('id')
    .eq('teacher_id', tokenRow.teacher_id)
    .maybeSingle();

  if (!existing?.id) {
    await supabaseAdmin.from('telegram_bot_connections').insert({
      teacher_id: tokenRow.teacher_id,
      connection_code: newConnectionCode(),
      code_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  const telegramUserId = String(message.from.id);
  const { data: consumed, error: consumeError } = await supabaseAdmin
    .from('telegram_bot_connection_tokens')
    .update({ used_at: now, used_by_telegram_user_id: telegramUserId })
    .eq('id', tokenRow.id)
    .is('used_at', null)
    .select('id')
    .maybeSingle();
  if (consumeError) throw consumeError;
  if (!consumed?.id) return { ok: false, reason: 'used' };

  await supabaseAdmin
    .from('telegram_bot_connections')
    .update({
      telegram_user_id: null,
      telegram_username: null,
      telegram_first_name: null,
      telegram_chat_id: null,
      pending_action: null,
      connected_at: null,
      updated_at: now,
    })
    .eq('telegram_user_id', telegramUserId)
    .neq('teacher_id', tokenRow.teacher_id);

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('telegram_bot_connections')
    .update({
      telegram_user_id: telegramUserId,
      telegram_username: message.from.username || null,
      telegram_first_name: message.from.first_name || null,
      telegram_chat_id: String(message.chat.id),
      connected_at: now,
      updated_at: now,
      pending_action: null,
    })
    .eq('teacher_id', tokenRow.teacher_id)
    .select('*')
    .single();
  if (updateError || !updated) return { ok: false, reason: 'invalid' };

  await logInteraction({
    teacherId: tokenRow.teacher_id,
    telegramUserId,
    telegramChatId: String(message.chat.id),
    direction: 'inbound',
    message: 'Deep link token consumed',
    intent: 'CONNECT',
    status: 'connected',
    metadata: { token_id: tokenRow.id },
  });

  return { ok: true, connection: updated as BotConnection };
}

function todayDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days, 12));
  return value.toISOString().slice(0, 10);
}

function monthReference() {
  return todayDate().slice(0, 7);
}

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function parseDate(text: string) {
  const normalized = normalize(text);
  const today = todayDate();
  if (normalized.includes('amanha')) return addDays(today, 1);
  if (normalized.includes('ontem')) return addDays(today, -1);
  const dateMatch = normalized.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const month = dateMatch[2].padStart(2, '0');
    const year = dateMatch[3] ? (dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3]) : today.slice(0, 4);
    return `${year}-${month}-${day}`;
  }
  return today;
}

function parseTime(text: string) {
  const normalized = normalize(text);
  const match = normalized.match(/\b(?:as|às|a)?\s*(\d{1,2})(?::|h)?(\d{2})?\b/);
  if (!match) return '';
  const hour = Number(match[1]);
  if (hour < 0 || hour > 23) return '';
  const minute = match[2] ? Number(match[2]) : 0;
  if (minute < 0 || minute > 59) return '';
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date(year, month - 1, day));
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

function helpText(connected: boolean) {
  if (!connected) {
    return [
      'Ola! Eu sou o LuminaBot, seu assistente da LuminaAI.',
      'Para conectar, volte na LuminaAI e clique em "Conectar meu Telegram".',
    ].join('\n');
  }
  return [
    'LuminaBot conectado.',
    'Voce pode enviar:',
    '/agenda - ver agenda de hoje',
    '/alunos - listar alunos',
    '/pendentes - pagamentos pendentes',
    'Marcar aula com Ana amanha as 15h',
    'Registrar pagamento do Joao de R$100',
    'Maria faltou hoje',
    'Criar anotacao para Pedro: revisar fracoes',
  ].join('\n');
}

function parseIntent(text: string): ParsedIntent {
  const raw = text.trim();
  const normalized = normalize(raw);

  if (['/start', '/ajuda', 'ajuda', 'help'].includes(normalized)) return { type: 'HELP' };
  if (normalized.startsWith('/agenda') || normalized.includes('agenda de hoje') || normalized.includes('minha agenda')) {
    return { type: 'AGENDA', date: parseDate(raw) };
  }
  if (normalized.startsWith('/alunos') || normalized.includes('listar alunos') || normalized === 'alunos') return { type: 'LIST_STUDENTS' };
  if (normalized.startsWith('/pendentes') || normalized.includes('pagamento pendente') || normalized.includes('quem esta com pagamento pendente')) return { type: 'PENDING' };
  if (normalized.includes('numero de alunos') || normalized.includes('quantos alunos')) return { type: 'COUNT_STUDENTS' };
  if (normalized.includes('relatorio financeiro') || normalized.includes('financeiro do mes') || normalized.includes('ganhos do mes')) return { type: 'FINANCIAL_REPORT' };

  const classMatch = raw.match(/marcar\s+aula\s+com\s+(.+?)\s+(hoje|amanh[aã]|ontem|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\s+(?:a?s|às)?\s*(\d{1,2}(?::|h)?\d{0,2})/i);
  if (classMatch) {
    return { type: 'CREATE_CLASS', studentName: classMatch[1].trim(), date: parseDate(classMatch[2]), time: parseTime(classMatch[3]) };
  }

  const paymentMatch = raw.match(/registrar\s+pagamento\s+(?:do|da|de)?\s*(.+?)\s+(?:de|no valor de)\s*r?\$?\s*([\d.,]+)/i);
  if (paymentMatch) {
    const amount = Number(paymentMatch[2].replace(/\./g, '').replace(',', '.'));
    return { type: 'REGISTER_PAYMENT', studentName: paymentMatch[1].trim(), amount };
  }

  const absenceMatch = raw.match(/(.+?)\s+faltou\s+(hoje|amanh[aã]|ontem|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)?/i);
  if (absenceMatch) return { type: 'REGISTER_ABSENCE', studentName: absenceMatch[1].trim(), date: parseDate(absenceMatch[2] || 'hoje') };

  const noteMatch = raw.match(/criar\s+anota[cç][aã]o\s+para\s+(.+?):\s*(.+)/i);
  if (noteMatch) return { type: 'CREATE_NOTE', studentName: noteMatch[1].trim(), note: noteMatch[2].trim() };

  return { type: 'UNKNOWN' };
}

function startTokenFromText(text: string) {
  const match = text.trim().match(/^\/start(?:@\w+)?\s+([A-Za-z0-9_-]{20,})$/);
  return match?.[1] || '';
}

function invalidTokenMessage(reason: 'invalid' | 'expired' | 'used') {
  if (reason === 'expired') return 'Esse link expirou. Volte na LuminaAI e clique novamente em "Conectar meu Telegram".';
  if (reason === 'used') return 'Esse link ja foi usado. Volte na LuminaAI e gere um novo link de conexao.';
  return 'Link de conexao invalido. Volte na LuminaAI e clique novamente em "Conectar meu Telegram".';
}

async function telegramSendMessage(chatId: string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${token()}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!response.ok) throw new Error('Falha ao responder no Telegram.');
}

async function logInteraction(input: {
  teacherId?: string | null;
  telegramUserId?: string | null;
  telegramChatId?: string | null;
  direction: 'inbound' | 'outbound';
  message: string;
  intent?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from('telegram_bot_interaction_logs').insert({
      teacher_id: input.teacherId || null,
      telegram_user_id: input.telegramUserId || null,
      telegram_chat_id: input.telegramChatId || null,
      direction: input.direction,
      message: input.message.slice(0, 2000),
      intent: input.intent || null,
      status: input.status || 'ok',
      metadata: input.metadata || null,
    });
  } catch {
    // Logging must never block the bot response.
  }
}

async function reply(chatId: string, text: string, context: { teacherId?: string | null; telegramUserId?: string | null; intent?: string; status?: string }) {
  await telegramSendMessage(chatId, text);
  await logInteraction({
    teacherId: context.teacherId,
    telegramUserId: context.telegramUserId,
    telegramChatId: chatId,
    direction: 'outbound',
    message: text,
    intent: context.intent,
    status: context.status,
  });
}

async function getConnectionByTelegram(telegramUserId: string) {
  const { data } = await supabaseAdmin
    .from('telegram_bot_connections')
    .select('*')
    .eq('telegram_user_id', telegramUserId)
    .maybeSingle();
  return data as BotConnection | null;
}

async function findStudents(teacherId: string, name: string) {
  const cleaned = name.trim();
  const { data, error } = await supabaseAdmin
    .from('students')
    .select('id, full_name, subject, user_id, price_per_class')
    .eq('teacher_id', teacherId)
    .ilike('full_name', `%${cleaned}%`)
    .limit(6);
  if (error) throw error;
  return (data || []) as StudentMatch[];
}

async function studentForIntent(teacherId: string, name: string) {
  const students = await findStudents(teacherId, name);
  if (students.length === 0) {
    return { error: 'Não encontrei esse aluno. Confira o nome ou cadastre primeiro na LuminaAI.' };
  }
  if (students.length > 1) {
    return { error: `Encontrei mais de um aluno com esse nome: ${students.map((item) => item.full_name).join(', ')}. Envie o nome mais completo.` };
  }
  return { student: students[0] };
}

async function setPendingAction(connection: BotConnection, action: PendingAction) {
  const { error } = await supabaseAdmin
    .from('telegram_bot_connections')
    .update({ pending_action: action, updated_at: new Date().toISOString() })
    .eq('id', connection.id);
  if (error) throw error;
}

async function clearPendingAction(connection: BotConnection) {
  await supabaseAdmin
    .from('telegram_bot_connections')
    .update({ pending_action: null, updated_at: new Date().toISOString() })
    .eq('id', connection.id);
}

async function executePendingAction(connection: BotConnection) {
  const action = connection.pending_action;
  if (!action) return 'Não há ação pendente para confirmar.';

  if (action.type === 'CREATE_CLASS') {
    const { error } = await supabaseAdmin.from('class_schedules').insert({
      teacher_id: connection.teacher_id,
      student_id: action.student_id,
      subject: action.subject,
      class_date: action.class_date,
      class_time: action.class_time,
      duration_minutes: 60,
      status: 'scheduled',
    });
    if (error) throw error;
    await clearPendingAction(connection);
    return `Aula com ${action.student_name} marcada para ${formatDate(action.class_date)} às ${formatTime(action.class_time)}.`;
  }

  if (action.type === 'REGISTER_PAYMENT') {
    const { error } = await supabaseAdmin.from('payments').insert({
      teacher_id: connection.teacher_id,
      student_id: action.student_id,
      student_user_id: action.student_user_id,
      month_reference: action.month_reference,
      amount: action.amount,
      paid_amount: action.amount,
      status: 'paid',
      paid_at: new Date().toISOString(),
    });
    if (error) throw error;
    await clearPendingAction(connection);
    return `Pagamento de R$ ${action.amount.toFixed(2).replace('.', ',')} registrado para ${action.student_name}.`;
  }

  if (action.type === 'REGISTER_ABSENCE') {
    const { data } = await supabaseAdmin
      .from('class_schedules')
      .select('id')
      .eq('teacher_id', connection.teacher_id)
      .eq('student_id', action.student_id)
      .eq('class_date', action.class_date)
      .eq('status', 'scheduled')
      .order('class_time')
      .limit(1)
      .maybeSingle();

    if (!data?.id) {
      await clearPendingAction(connection);
      return `Não encontrei aula agendada para ${action.student_name} em ${formatDate(action.class_date)}.`;
    }

    const { error } = await supabaseAdmin.from('class_schedules').update({ status: 'absence' }).eq('id', data.id);
    if (error) throw error;
    await clearPendingAction(connection);
    return `Falta de ${action.student_name} registrada em ${formatDate(action.class_date)}.`;
  }

  const { error } = await supabaseAdmin.from('bot_student_notes').insert({
    teacher_id: connection.teacher_id,
    student_id: action.student_id,
    note: action.note,
  });
  if (error) throw error;
  await clearPendingAction(connection);
  return `Anotação criada para ${action.student_name}.`;
}

async function handleConnectedMessage(connection: BotConnection, text: string) {
  const normalized = normalize(text);
  if (['sim', 's', 'confirmar', 'confirmo'].includes(normalized)) return executePendingAction(connection);
  if (['nao', 'não', 'n', 'cancelar'].includes(normalized)) {
    await clearPendingAction(connection);
    return 'Tudo bem. Ação cancelada.';
  }

  const intent = parseIntent(text);
  if (intent.type === 'HELP') return helpText(true);

  if (intent.type === 'AGENDA') {
    const { data, error } = await supabaseAdmin
      .from('class_schedules')
      .select('class_time, subject, status, students(full_name)')
      .eq('teacher_id', connection.teacher_id)
      .eq('class_date', intent.date)
      .order('class_time');
    if (error) throw error;
    if (!data?.length) return `Nenhuma aula encontrada para ${formatDate(intent.date)}.`;
    return [`Agenda de ${formatDate(intent.date)}:`].concat(data.map((item: any) => {
      const student = Array.isArray(item.students) ? item.students[0] : item.students;
      return `${formatTime(item.class_time)} - ${student?.full_name || 'Aluno'} - ${item.subject || 'Aula'} (${item.status})`;
    })).join('\n');
  }

  if (intent.type === 'LIST_STUDENTS') {
    const { data, error } = await supabaseAdmin.from('students').select('full_name, subject, status').eq('teacher_id', connection.teacher_id).order('full_name').limit(30);
    if (error) throw error;
    if (!data?.length) return 'Você ainda não tem alunos cadastrados.';
    return ['Seus alunos:'].concat(data.map((item) => `${item.full_name} - ${item.subject || 'sem matéria'} - ${item.status}`)).join('\n');
  }

  if (intent.type === 'COUNT_STUDENTS') {
    const { count, error } = await supabaseAdmin.from('students').select('id', { count: 'exact', head: true }).eq('teacher_id', connection.teacher_id);
    if (error) throw error;
    return `Você tem ${count || 0} aluno${count === 1 ? '' : 's'} cadastrado${count === 1 ? '' : 's'}.`;
  }

  if (intent.type === 'PENDING') {
    const currentMonth = monthReference();
    const { data: students, error } = await supabaseAdmin.from('students').select('id, full_name').eq('teacher_id', connection.teacher_id).eq('status', 'active').order('full_name');
    if (error) throw error;
    const { data: payments } = await supabaseAdmin.from('payments').select('student_id').eq('teacher_id', connection.teacher_id).eq('month_reference', currentMonth).eq('status', 'paid');
    const paidIds = new Set((payments || []).map((item) => item.student_id));
    const pending = (students || []).filter((student) => !paidIds.has(student.id));
    if (!pending.length) return `Nenhum pagamento pendente em ${currentMonth}.`;
    return [`Pagamentos pendentes em ${currentMonth}:`].concat(pending.map((student) => student.full_name)).join('\n');
  }

  if (intent.type === 'FINANCIAL_REPORT') {
    const currentMonth = monthReference();
    const { data, error } = await supabaseAdmin.from('payments').select('paid_amount, status').eq('teacher_id', connection.teacher_id).eq('month_reference', currentMonth);
    if (error) throw error;
    const paid = (data || []).filter((item) => item.status === 'paid').reduce((sum, item) => sum + Number(item.paid_amount || 0), 0);
    return `Financeiro de ${currentMonth}: R$ ${paid.toFixed(2).replace('.', ',')} recebidos.`;
  }

  if (intent.type === 'CREATE_CLASS') {
    if (!intent.time) return 'Não entendi o horário. Exemplo: Marcar aula com Ana amanhã às 15h.';
    const { student, error } = await studentForIntent(connection.teacher_id, intent.studentName);
    if (!student) return error || 'Aluno não encontrado.';
    const action: PendingAction = { type: 'CREATE_CLASS', student_id: student.id, student_name: student.full_name, subject: student.subject, class_date: intent.date, class_time: intent.time };
    await setPendingAction(connection, action);
    return `Encontrei ${student.full_name}. Confirma marcar aula para ${formatDate(intent.date)} às ${formatTime(intent.time)}? Responda SIM para confirmar ou NÃO para cancelar.`;
  }

  if (intent.type === 'REGISTER_PAYMENT') {
    if (!Number.isFinite(intent.amount) || intent.amount <= 0) return 'Não entendi o valor do pagamento.';
    const { student, error } = await studentForIntent(connection.teacher_id, intent.studentName);
    if (!student) return error || 'Aluno não encontrado.';
    const action: PendingAction = { type: 'REGISTER_PAYMENT', student_id: student.id, student_name: student.full_name, amount: intent.amount, month_reference: monthReference(), student_user_id: student.user_id };
    await setPendingAction(connection, action);
    return `Confirma registrar pagamento de R$ ${intent.amount.toFixed(2).replace('.', ',')} para ${student.full_name}? Responda SIM para confirmar ou NÃO para cancelar.`;
  }

  if (intent.type === 'REGISTER_ABSENCE') {
    const { student, error } = await studentForIntent(connection.teacher_id, intent.studentName);
    if (!student) return error || 'Aluno não encontrado.';
    const action: PendingAction = { type: 'REGISTER_ABSENCE', student_id: student.id, student_name: student.full_name, class_date: intent.date };
    await setPendingAction(connection, action);
    return `Confirma registrar falta de ${student.full_name} em ${formatDate(intent.date)}? Responda SIM para confirmar ou NÃO para cancelar.`;
  }

  if (intent.type === 'CREATE_NOTE') {
    const { student, error } = await studentForIntent(connection.teacher_id, intent.studentName);
    if (!student) return error || 'Aluno não encontrado.';
    const action: PendingAction = { type: 'CREATE_NOTE', student_id: student.id, student_name: student.full_name, note: intent.note };
    await setPendingAction(connection, action);
    return `Confirma criar anotação para ${student.full_name}: "${intent.note}"? Responda SIM para confirmar ou NÃO para cancelar.`;
  }

  return 'Não entendi esse comando. Envie /ajuda para ver exemplos.';
}

export async function handleTelegramUpdate(update: { message?: TelegramMessage }) {
  const message = update.message;
  const text = message?.text?.trim();
  const from = message?.from;
  if (!message || !text || !from) return;

  const chatId = String(message.chat.id);
  const telegramUserId = String(from.id);

  await logInteraction({
    telegramUserId,
    telegramChatId: chatId,
    direction: 'inbound',
    message: text,
  });

  const startToken = startTokenFromText(text);
  if (startToken) {
    const linked = await consumeTelegramConnectToken(startToken, message);
    if (linked.ok) {
      await reply(chatId, 'Seu Telegram foi conectado com sucesso à LuminaAI. Agora você pode organizar sua rotina por aqui.', { teacherId: linked.connection.teacher_id, telegramUserId, intent: 'CONNECT' });
      return;
    }
    await reply(chatId, invalidTokenMessage(linked.reason), { telegramUserId, intent: 'CONNECT', status: linked.reason });
    return;
  }

  const existing = await getConnectionByTelegram(telegramUserId);
  if (!existing) {
    await reply(chatId, helpText(false), { telegramUserId, intent: 'START' });
    return;
  }

  const answer = await handleConnectedMessage(existing, text);
  await reply(chatId, answer, { teacherId: existing.teacher_id, telegramUserId, intent: parseIntent(text).type });
}

export function newConnectionCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'LUM-';
  for (let i = 0; i < 8; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}
