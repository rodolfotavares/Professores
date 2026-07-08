import { supabaseAdmin } from './supabase-admin';

export type ConversationIntent =
  | 'CONSULTAR_AGENDA'
  | 'CRIAR_AULA'
  | 'ALTERAR_AULA'
  | 'CANCELAR_AULA'
  | 'REGISTRAR_PAGAMENTO'
  | 'CONSULTAR_FINANCEIRO'
  | 'LISTAR_PAGAMENTOS_PENDENTES'
  | 'REGISTRAR_FALTA'
  | 'CONSULTAR_ALUNO'
  | 'GERAR_RELATORIO_ALUNO'
  | 'CRIAR_ANOTACAO_AULA'
  | 'GERAR_TEXTO_PARA_PAIS_OU_ALUNO'
  | 'ORGANIZAR_SEMANA'
  | 'RESUMIR_DADOS'
  | 'PEDIR_AJUDA'
  | 'APAGAR_HISTORICO'
  | 'CONVERSA_GERAL';

type BotConnection = {
  id: string;
  teacher_id: string;
  telegram_user_id: string | null;
  telegram_chat_id: string | null;
  pending_action: BotPendingAction | null;
};

type StudentLite = {
  id: string;
  user_id: string | null;
  full_name: string;
  subject: string | null;
  status: string | null;
  guardian_whatsapp?: string | null;
  price_per_class?: number | null;
};

type ClassLite = {
  id: string;
  student_id: string;
  class_date: string;
  class_time: string;
  duration_minutes: number;
  subject: string | null;
  status: string;
  teacher_notes?: string | null;
  students?: { full_name: string } | null;
};

type PaymentLite = {
  student_id: string;
  month_reference: string;
  amount: number;
  paid_amount: number;
  status: string;
  due_date: string | null;
  students?: { full_name: string } | null;
};

type LessonReportLite = {
  student_id: string;
  summary: string | null;
  taught_content: string | null;
  student_questions: string | null;
  reinforcement_points: string | null;
  homework: string | null;
  next_recommendation: string | null;
  parent_message: string | null;
  guardian_message: string | null;
  learning_progress: string | null;
  learning_score: number | null;
  detected_doubts: string | null;
  learning_evidence: string | null;
  created_at: string;
  students?: { full_name: string; subject?: string | null; guardian_whatsapp?: string | null } | null;
  class_schedules?: { class_date: string; class_time: string; subject: string | null } | null;
};

type BotPendingAction =
  | {
      type: 'CREATE_CLASS';
      intent: 'CRIAR_AULA';
      student_id: string;
      student_name: string;
      student_user_id: string | null;
      subject: string | null;
      class_date: string;
      class_time: string;
      duration_minutes: number;
      summary: string;
    }
  | {
      type: 'REGISTER_PAYMENT';
      intent: 'REGISTRAR_PAGAMENTO';
      student_id: string;
      student_name: string;
      student_user_id: string | null;
      amount: number;
      month_reference: string;
      summary: string;
    }
  | {
      type: 'REGISTER_ABSENCE';
      intent: 'REGISTRAR_FALTA';
      student_id: string;
      student_name: string;
      class_date: string;
      summary: string;
    }
  | {
      type: 'CREATE_NOTE';
      intent: 'CRIAR_ANOTACAO_AULA';
      student_id: string;
      student_name: string;
      note: string;
      summary: string;
    }
  | {
      type: 'DELETE_HISTORY';
      intent: 'APAGAR_HISTORICO';
      summary: string;
    };

type DetectedIntent = {
  intent: ConversationIntent;
  studentName?: string;
  date?: string;
  time?: string;
  amount?: number;
  note?: string;
  topic?: string;
  needsClarification?: string;
};

type TeacherContext = {
  students: StudentLite[];
  classes: ClassLite[];
  payments: PaymentLite[];
  reports: LessonReportLite[];
};

export interface LLMProvider {
  isConfigured(): boolean;
  complete(input: { systemPrompt: string; userMessage: string; context: string }): Promise<string | null>;
}

class ConfigurableLLMProvider implements LLMProvider {
  isConfigured() {
    return Boolean(process.env.LLM_PROVIDER && process.env.LLM_API_KEY);
  }

  async complete(input: { systemPrompt: string; userMessage: string; context: string }) {
    if (!this.isConfigured()) return null;
    const provider = (process.env.LLM_PROVIDER || '').toLowerCase();
    const model = process.env.LLM_MODEL || 'gpt-4o-mini';
    const apiKey = process.env.LLM_API_KEY;

    if (provider !== 'openai' && provider !== 'openai-compatible') return null;

    try {
      const response = await fetch(process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: input.systemPrompt },
            { role: 'system', content: `Dados disponiveis:\n${input.context}` },
            { role: 'user', content: input.userMessage },
          ],
          temperature: 0.3,
        }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data?.choices?.[0]?.message?.content?.trim() || null;
    } catch {
      return null;
    }
  }
}

function todayDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days, 12)).toISOString().slice(0, 10);
}

function monthReference() {
  return todayDate().slice(0, 7);
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date(year, month - 1, day));
}

function formatTime(time?: string | null) {
  return time ? time.slice(0, 5) : '';
}

function currency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function parseDate(text: string) {
  const normalized = normalize(text);
  const today = todayDate();
  if (normalized.includes('depois de amanha')) return addDays(today, 2);
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
  const match = normalized.match(/\b(?:as|a)?\s*(\d{1,2})(?::|h)?(\d{2})?\b/);
  if (!match) return '';
  const hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return '';
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

function isConfirmation(text: string) {
  return ['sim', 's', 'pode', 'pode sim', 'confirmar', 'confirmo', 'isso', 'esse mesmo', 'pode marcar', 'ok', 'ta bom'].includes(normalize(text));
}

function isCancellation(text: string) {
  return ['nao', 'n', 'cancelar', 'cancela', 'deixa pra la', 'esquece'].includes(normalize(text));
}

function contextSummary(context: TeacherContext) {
  const classes = context.classes
    .slice(0, 12)
    .map((item) => `${item.students?.full_name || 'Aluno'} ${formatDate(item.class_date)} ${formatTime(item.class_time)} ${item.status}`)
    .join('\n');
  const students = context.students.map((item) => `${item.full_name} - ${item.subject || 'sem materia'} - ${item.status}`).join('\n');
  const payments = context.payments.map((item) => `${item.students?.full_name || 'Aluno'} ${item.month_reference} ${item.status} ${currency(Number(item.paid_amount || 0))}/${currency(Number(item.amount || 0))}`).join('\n');
  const reports = context.reports
    .slice(0, 8)
    .map((item) => `${item.students?.full_name || 'Aluno'} score ${item.learning_score ?? '-'} duvidas ${item.detected_doubts || '-'}`)
    .join('\n');
  return [`Alunos:\n${students || 'Nenhum aluno.'}`, `Agenda:\n${classes || 'Nenhuma aula.'}`, `Pagamentos:\n${payments || 'Nenhum pagamento.'}`, `Relatorios:\n${reports || 'Nenhum relatorio.'}`].join('\n\n');
}

export class IntentDetectionService {
  detect(message: string): DetectedIntent {
    const raw = message.trim();
    const text = normalize(raw);

    if (['/start', '/ajuda', 'ajuda', 'help', 'comandos'].includes(text) || text.includes('o que voce faz')) return { intent: 'PEDIR_AJUDA' };
    if (text.includes('apagar historico') || text.includes('limpar historico') || text.includes('excluir historico')) return { intent: 'APAGAR_HISTORICO' };
    if (text.includes('agenda') || text.includes('aulas de hoje') || text.includes('minhas aulas')) return { intent: 'CONSULTAR_AGENDA', date: parseDate(raw) };
    if (text.includes('organizar minha semana') || text.includes('organize minha semana') || text.includes('planejar semana')) return { intent: 'ORGANIZAR_SEMANA' };
    if (text.includes('pagamento atrasado') || text.includes('pagamentos atrasados') || text.includes('pagamento pendente') || text.includes('quem esta devendo')) return { intent: 'LISTAR_PAGAMENTOS_PENDENTES' };
    if (text.includes('financeiro') || text.includes('ganhos') || text.includes('recebi') || text.includes('resumo do mes')) return { intent: 'CONSULTAR_FINANCEIRO' };
    if (text.includes('precisam de mais atencao') || text.includes('dificuldade') || text.includes('dificuldades')) return { intent: 'RESUMIR_DADOS' };
    if (text.includes('evolucao') || text.includes('desempenho')) return { intent: 'GERAR_RELATORIO_ALUNO', studentName: this.extractStudentName(raw) };
    if (text.includes('relatorio da aula') || text.includes('relatorio de aula')) return { intent: 'CRIAR_ANOTACAO_AULA', studentName: this.extractStudentName(raw), note: raw };
    if (text.includes('mensagem') || text.includes('avisar') || text.includes('mae') || text.includes('responsavel')) return { intent: 'GERAR_TEXTO_PARA_PAIS_OU_ALUNO', studentName: this.extractStudentName(raw), topic: raw };

    const classMatch = raw.match(/(?:marque|marca|agende|agenda|crie)\s+(?:uma\s+)?aula\s+com\s+(.+?)\s+(hoje|amanh[aã]|ontem|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\s+(?:a?s|às)?\s*(\d{1,2}(?::|h)?\d{0,2})/i);
    if (classMatch) return { intent: 'CRIAR_AULA', studentName: classMatch[1].trim(), date: parseDate(classMatch[2]), time: parseTime(classMatch[3]) };

    const paymentMatch = raw.match(/(?:registrar|registre|marca|marque)\s+pagamento\s+(?:do|da|de)?\s*(.+?)\s+(?:de|no valor de)\s*r?\$?\s*([\d.,]+)/i);
    if (paymentMatch) return { intent: 'REGISTRAR_PAGAMENTO', studentName: paymentMatch[1].trim(), amount: Number(paymentMatch[2].replace(/\./g, '').replace(',', '.')) };

    const absenceMatch = raw.match(/(.+?)\s+faltou\s+(hoje|amanh[aã]|ontem|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)?/i);
    if (absenceMatch) return { intent: 'REGISTRAR_FALTA', studentName: absenceMatch[1].trim(), date: parseDate(absenceMatch[2] || 'hoje') };

    const noteMatch = raw.match(/(?:anote|crie anotacao|criar anotacao)\s+(?:para|sobre)\s+(.+?):\s*(.+)/i);
    if (noteMatch) return { intent: 'CRIAR_ANOTACAO_AULA', studentName: noteMatch[1].trim(), note: noteMatch[2].trim() };

    const studentName = this.extractStudentName(raw);
    if (studentName && (text.includes('aluno') || text.includes('como esta') || text.includes('sobre'))) return { intent: 'CONSULTAR_ALUNO', studentName };

    return { intent: 'CONVERSA_GERAL' };
  }

  private extractStudentName(message: string) {
    const match = message.match(/(?:do|da|de|com|para|sobre|aluno|aluna)\s+([A-ZÁÀÂÃÉÈÊÍÓÔÕÚÇ][\wÀ-ÿ]*(?:\s+[A-ZÁÀÂÃÉÈÊÍÓÔÕÚÇ][\wÀ-ÿ]*)?)/);
    return match?.[1]?.trim();
  }
}

export class LuminaDataContextService {
  async build(teacherId: string): Promise<TeacherContext> {
    const today = todayDate();
    const inThirtyDays = addDays(today, 30);
    const currentMonth = monthReference();

    const [studentsResult, classesResult, paymentsResult, reportsResult] = await Promise.all([
      supabaseAdmin.from('students').select('id, user_id, full_name, subject, status, guardian_whatsapp, price_per_class').eq('teacher_id', teacherId).order('full_name').limit(80),
      supabaseAdmin
        .from('class_schedules')
        .select('id, student_id, class_date, class_time, duration_minutes, subject, status, teacher_notes, students(full_name)')
        .eq('teacher_id', teacherId)
        .gte('class_date', addDays(today, -7))
        .lte('class_date', inThirtyDays)
        .order('class_date')
        .order('class_time')
        .limit(80),
      supabaseAdmin
        .from('payments')
        .select('student_id, month_reference, amount, paid_amount, status, due_date, students(full_name)')
        .eq('teacher_id', teacherId)
        .eq('month_reference', currentMonth)
        .limit(80),
      supabaseAdmin
        .from('lesson_reports')
        .select('student_id, summary, taught_content, student_questions, reinforcement_points, homework, next_recommendation, parent_message, guardian_message, learning_progress, learning_score, detected_doubts, learning_evidence, created_at, students(full_name, subject, guardian_whatsapp), class_schedules(class_date, class_time, subject)')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    if (studentsResult.error) throw studentsResult.error;
    if (classesResult.error) throw classesResult.error;
    if (paymentsResult.error) throw paymentsResult.error;
    if (reportsResult.error) throw reportsResult.error;

    return {
      students: (studentsResult.data || []) as StudentLite[],
      classes: (classesResult.data || []).map((item: any) => ({
        ...item,
        students: Array.isArray(item.students) ? item.students[0] : item.students,
      })) as ClassLite[],
      payments: (paymentsResult.data || []).map((item: any) => ({
        ...item,
        students: Array.isArray(item.students) ? item.students[0] : item.students,
      })) as PaymentLite[],
      reports: (reportsResult.data || []).map((item: any) => ({
        ...item,
        students: Array.isArray(item.students) ? item.students[0] : item.students,
        class_schedules: Array.isArray(item.class_schedules) ? item.class_schedules[0] : item.class_schedules,
      })) as LessonReportLite[],
    };
  }

  findStudent(context: TeacherContext, name?: string) {
    if (!name) return { error: 'Qual aluno voce quer consultar ou alterar?' };
    const normalized = normalize(name);
    const matches = context.students.filter((student) => normalize(student.full_name).includes(normalized) || normalized.includes(normalize(student.full_name)));
    if (matches.length === 0) return { error: `Nao encontrei o aluno "${name}" nos seus cadastros.` };
    if (matches.length > 1) return { error: `Encontrei mais de um aluno: ${matches.map((item) => item.full_name).join(', ')}. Me envie o nome mais completo.` };
    return { student: matches[0] };
  }
}

export class BotConversationState {
  async set(connection: BotConnection, action: BotPendingAction) {
    const { error } = await supabaseAdmin.from('telegram_bot_connections').update({ pending_action: action, updated_at: new Date().toISOString() }).eq('id', connection.id);
    if (error) throw error;
  }

  async clear(connection: BotConnection) {
    const { error } = await supabaseAdmin.from('telegram_bot_connections').update({ pending_action: null, updated_at: new Date().toISOString() }).eq('id', connection.id);
    if (error) throw error;
  }
}

export class BotInteractionLog {
  async record(input: { teacherId: string; telegramUserId?: string | null; message: string; response?: string; intent: string; status?: string; metadata?: Record<string, unknown> }) {
    await supabaseAdmin.from('telegram_bot_interaction_logs').insert({
      teacher_id: input.teacherId,
      telegram_user_id: input.telegramUserId || null,
      direction: 'inbound',
      message: input.message.slice(0, 2000),
      intent: input.intent,
      status: input.status || 'handled',
      metadata: { ...(input.metadata || {}), assistant_response: input.response?.slice(0, 2000) },
    });
  }

  async deleteHistory(teacherId: string) {
    const { error } = await supabaseAdmin.from('telegram_bot_interaction_logs').delete().eq('teacher_id', teacherId);
    if (error) throw error;
  }
}

export class BotActionExecutor {
  async execute(connection: BotConnection, action: BotPendingAction) {
    if (action.type === 'CREATE_CLASS') {
      const { error } = await supabaseAdmin.from('class_schedules').insert({
        teacher_id: connection.teacher_id,
        student_id: action.student_id,
        student_user_id: action.student_user_id,
        subject: action.subject,
        class_date: action.class_date,
        class_time: action.class_time,
        duration_minutes: action.duration_minutes,
        status: 'scheduled',
      });
      if (error) throw error;
      return `Pronto! Aula com ${action.student_name} marcada para ${formatDate(action.class_date)} as ${formatTime(action.class_time)}.`;
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
      return `Pronto! Registrei o pagamento de ${currency(action.amount)} para ${action.student_name}.`;
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
      if (!data?.id) return `Nao encontrei aula agendada para ${action.student_name} em ${formatDate(action.class_date)}. Nada foi alterado.`;
      const { error } = await supabaseAdmin.from('class_schedules').update({ status: 'absence' }).eq('id', data.id).eq('teacher_id', connection.teacher_id);
      if (error) throw error;
      return `Pronto! Registrei falta de ${action.student_name} em ${formatDate(action.class_date)}.`;
    }

    if (action.type === 'CREATE_NOTE') {
      const { error } = await supabaseAdmin.from('bot_student_notes').insert({
        teacher_id: connection.teacher_id,
        student_id: action.student_id,
        note: action.note,
        source: 'telegram',
      });
      if (error) throw error;
      return `Pronto! Criei a anotacao para ${action.student_name}.`;
    }

    return 'Historico apagado com sucesso.';
  }
}

export class ConversationalAssistantService {
  private intentDetector = new IntentDetectionService();
  private dataContext = new LuminaDataContextService();
  private state = new BotConversationState();
  private actionExecutor = new BotActionExecutor();
  private interactionLog = new BotInteractionLog();
  private llm: LLMProvider;

  constructor(llm: LLMProvider = new ConfigurableLLMProvider()) {
    this.llm = llm;
  }

  async handleMessage(connection: BotConnection, message: string) {
    if (connection.pending_action) {
      const pendingResponse = await this.handlePendingAction(connection, message);
      if (pendingResponse) return pendingResponse;
    }

    const detected = this.intentDetector.detect(message);
    const context = await this.dataContext.build(connection.teacher_id);
    const response = await this.respond(connection, detected, context, message);
    await this.interactionLog.record({
      teacherId: connection.teacher_id,
      telegramUserId: connection.telegram_user_id,
      message,
      response,
      intent: detected.intent,
    });
    return response;
  }

  private async handlePendingAction(connection: BotConnection, message: string) {
    const action = connection.pending_action;
    if (!action) return '';

    const text = normalize(message);
    if (isCancellation(message)) {
      await this.state.clear(connection);
      return 'Tudo bem, cancelei essa acao.';
    }

    if (action.type === 'CREATE_CLASS' && (text.includes('troca') || text.includes('muda') || text.includes('remarca'))) {
      const nextAction = { ...action };
      if (text.includes('amanha') || /\d{1,2}[/-]\d{1,2}/.test(text)) nextAction.class_date = parseDate(message);
      const newTime = parseTime(message);
      if (newTime) nextAction.class_time = newTime;
      nextAction.summary = `marcar aula com ${nextAction.student_name} em ${formatDate(nextAction.class_date)} as ${formatTime(nextAction.class_time)}`;
      await this.state.set(connection, nextAction);
      return `Atualizei a acao pendente. Confirma ${nextAction.summary}?`;
    }

    if (!isConfirmation(message)) {
      return `Tenho uma acao aguardando confirmacao: ${action.summary}. Responda "sim" para confirmar ou "cancelar" para desistir.`;
    }

    if (action.type === 'DELETE_HISTORY') {
      await this.interactionLog.deleteHistory(connection.teacher_id);
      await this.state.clear(connection);
      return 'Pronto! Apaguei o historico de conversas do LuminaBot para sua conta.';
    }

    const result = await this.actionExecutor.execute(connection, action);
    await this.state.clear(connection);
    await this.interactionLog.record({
      teacherId: connection.teacher_id,
      telegramUserId: connection.telegram_user_id,
      message,
      response: result,
      intent: action.intent,
      status: 'executed',
      metadata: { action },
    });
    return result;
  }

  private async respond(connection: BotConnection, detected: DetectedIntent, context: TeacherContext, originalMessage: string) {
    if (detected.intent === 'PEDIR_AJUDA') return this.help();
    if (detected.intent === 'APAGAR_HISTORICO') return this.prepareDeleteHistory(connection);
    if (detected.intent === 'CONSULTAR_AGENDA') return this.agenda(context, detected.date || todayDate());
    if (detected.intent === 'ORGANIZAR_SEMANA') return this.organizeWeek(context);
    if (detected.intent === 'LISTAR_PAGAMENTOS_PENDENTES') return this.pendingPayments(context);
    if (detected.intent === 'CONSULTAR_FINANCEIRO') return this.financeSummary(context);
    if (detected.intent === 'RESUMIR_DADOS') return this.attentionSummary(context);
    if (detected.intent === 'CONSULTAR_ALUNO') return this.studentSummary(context, detected.studentName);
    if (detected.intent === 'GERAR_RELATORIO_ALUNO') return this.studentReport(context, detected.studentName);
    if (detected.intent === 'GERAR_TEXTO_PARA_PAIS_OU_ALUNO') return this.parentText(context, detected.studentName, detected.topic || originalMessage);
    if (detected.intent === 'CRIAR_AULA') return this.prepareCreateClass(connection, context, detected);
    if (detected.intent === 'REGISTRAR_PAGAMENTO') return this.preparePayment(connection, context, detected);
    if (detected.intent === 'REGISTRAR_FALTA') return this.prepareAbsence(connection, context, detected);
    if (detected.intent === 'CRIAR_ANOTACAO_AULA') return this.prepareNote(connection, context, detected, originalMessage);

    const llmAnswer = await this.llm.complete({
      systemPrompt: 'Voce e o LumiBot, assistente inteligente da LuminaAI. Sua funcao e ajudar professores particulares a organizar alunos, aulas, agenda, pagamentos, relatorios e rotina. Responda de forma clara, profissional e util. Use apenas os dados fornecidos pelo sistema. Nao invente informacoes. Quando o professor pedir uma acao sensivel, solicite confirmacao antes de executar.',
      userMessage: originalMessage,
      context: contextSummary(context),
    });
    if (llmAnswer) return llmAnswer;

    return 'Entendi. Posso te ajudar com agenda, alunos, pagamentos, relatorios, mensagens para responsaveis e organizacao da semana. Se quiser, escreva do seu jeito, por exemplo: "Como esta minha agenda de hoje?" ou "Marque aula com Ana amanha as 15h".';
  }

  private help() {
    return [
      'Sou o LumiBot. Voce pode conversar comigo naturalmente.',
      'Exemplos:',
      '- Como esta minha agenda de hoje?',
      '- Tenho algum aluno com pagamento atrasado?',
      '- Me ajude a organizar minha semana.',
      '- Marque aula com Ana amanha as 15h.',
      '- O Pedro faltou hoje, registra pra mim.',
      '- Como foi a evolucao da Maria nas ultimas aulas?',
      'Quando uma acao alterar dados, eu sempre vou pedir confirmacao antes.',
    ].join('\n');
  }

  private agenda(context: TeacherContext, date: string) {
    const classes = context.classes.filter((item) => item.class_date === date).sort((a, b) => a.class_time.localeCompare(b.class_time));
    if (!classes.length) return `Voce nao tem aulas agendadas para ${formatDate(date)}.`;
    return [`Em ${formatDate(date)}, voce tem ${classes.length} aula${classes.length === 1 ? '' : 's'}:`]
      .concat(classes.map((item) => `- ${item.students?.full_name || 'Aluno'} as ${formatTime(item.class_time)} (${item.subject || 'Aula'}, ${item.status})`))
      .join('\n');
  }

  private organizeWeek(context: TeacherContext) {
    const today = todayDate();
    const weekEnd = addDays(today, 7);
    const weekClasses = context.classes.filter((item) => item.class_date >= today && item.class_date <= weekEnd && item.status === 'scheduled');
    const pending = this.pendingPaymentRows(context);
    const attention = this.attentionRows(context).slice(0, 3);
    return [
      `Para os proximos 7 dias, encontrei ${weekClasses.length} aula${weekClasses.length === 1 ? '' : 's'} agendada${weekClasses.length === 1 ? '' : 's'}.`,
      weekClasses.length ? `Dias mais cheios: ${this.busyDays(weekClasses)}.` : 'Ainda nao ha aulas na semana.',
      pending.length ? `Pagamentos para acompanhar: ${pending.map((item) => item.students?.full_name || 'Aluno').join(', ')}.` : 'Nao encontrei pagamentos pendentes neste mes.',
      attention.length ? `Alunos para observar: ${attention.map((item) => item.name).join(', ')}.` : 'Nao encontrei alertas fortes nos relatorios recentes.',
      'Sugestao: revise primeiro pagamentos pendentes, depois prepare as aulas dos alunos com mais pontos de reforco.',
    ].join('\n');
  }

  private pendingPaymentRows(context: TeacherContext) {
    const paid = new Set(context.payments.filter((item) => item.status === 'paid').map((item) => item.student_id));
    const explicitPending = context.payments.filter((item) => item.status !== 'paid');
    const withoutPayment = context.students.filter((student) => student.status === 'active' && !paid.has(student.id) && !explicitPending.some((payment) => payment.student_id === student.id));
    return explicitPending.concat(withoutPayment.map((student) => ({
      student_id: student.id,
      month_reference: monthReference(),
      amount: Number(student.price_per_class || 0),
      paid_amount: 0,
      status: 'pending',
      due_date: null,
      students: { full_name: student.full_name },
    })));
  }

  private pendingPayments(context: TeacherContext) {
    const pending = this.pendingPaymentRows(context);
    if (!pending.length) return `Nao encontrei pagamentos pendentes em ${monthReference()}.`;
    return [`Pagamentos pendentes em ${monthReference()}:`].concat(pending.map((item) => `- ${item.students?.full_name || 'Aluno'}: ${currency(Number(item.amount || 0))} (${item.status})`)).join('\n');
  }

  private financeSummary(context: TeacherContext) {
    const paid = context.payments.filter((item) => item.status === 'paid').reduce((sum, item) => sum + Number(item.paid_amount || item.amount || 0), 0);
    const pending = this.pendingPaymentRows(context).reduce((sum, item) => sum + Number(item.amount || 0) - Number(item.paid_amount || 0), 0);
    return [`Resumo financeiro de ${monthReference()}:`, `- Recebido: ${currency(paid)}`, `- A receber/pendente: ${currency(pending)}`, `- Alunos ativos: ${context.students.filter((item) => item.status === 'active').length}`].join('\n');
  }

  private attentionRows(context: TeacherContext) {
    const byStudent = new Map<string, { name: string; issues: string[]; scores: number[] }>();
    for (const report of context.reports) {
      const name = report.students?.full_name || 'Aluno';
      const current = byStudent.get(report.student_id) || { name, issues: [], scores: [] };
      if (report.detected_doubts) current.issues.push(report.detected_doubts);
      if (report.reinforcement_points) current.issues.push(report.reinforcement_points);
      if (typeof report.learning_score === 'number') current.scores.push(report.learning_score);
      byStudent.set(report.student_id, current);
    }
    return Array.from(byStudent.values())
      .map((item) => ({ ...item, average: item.scores.length ? item.scores.reduce((sum, score) => sum + score, 0) / item.scores.length : 100 }))
      .filter((item) => item.average < 70 || item.issues.length >= 2)
      .sort((a, b) => a.average - b.average);
  }

  private attentionSummary(context: TeacherContext) {
    const rows = this.attentionRows(context);
    if (!rows.length) return 'Nao encontrei alunos com sinais claros de dificuldade nos relatorios recentes. Isso depende dos relatorios de aula estarem preenchidos.';
    return ['Alunos que podem precisar de mais atencao:']
      .concat(rows.slice(0, 5).map((item) => `- ${item.name}: media ${Math.round(item.average)}. Pontos: ${item.issues.slice(0, 2).join('; ') || 'sem detalhe registrado'}`))
      .join('\n');
  }

  private studentSummary(context: TeacherContext, studentName?: string) {
    const { student, error } = this.dataContext.findStudent(context, studentName);
    if (!student) return error || 'Nao encontrei esse aluno.';
    const nextClasses = context.classes.filter((item) => item.student_id === student.id && item.status === 'scheduled').slice(0, 3);
    const reports = context.reports.filter((item) => item.student_id === student.id).slice(0, 3);
    return [
      `${student.full_name} - ${student.subject || 'sem materia cadastrada'} (${student.status}).`,
      nextClasses.length ? `Proximas aulas: ${nextClasses.map((item) => `${formatDate(item.class_date)} as ${formatTime(item.class_time)}`).join(', ')}.` : 'Nao encontrei proximas aulas agendadas.',
      reports.length ? `Relatorios recentes: ${reports.map((item) => item.summary || item.learning_progress || item.detected_doubts || 'sem resumo').join(' | ')}` : 'Ainda nao ha relatorios recentes cadastrados.',
    ].join('\n');
  }

  private studentReport(context: TeacherContext, studentName?: string) {
    const { student, error } = this.dataContext.findStudent(context, studentName);
    if (!student) return error || 'Nao encontrei esse aluno.';
    const reports = context.reports.filter((item) => item.student_id === student.id).slice(0, 5);
    if (!reports.length) return `Ainda nao ha relatorios suficientes para avaliar a evolucao de ${student.full_name}.`;
    const scores = reports.map((item) => item.learning_score).filter((score): score is number => typeof score === 'number');
    const avg = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
    return [
      `Evolucao de ${student.full_name}:`,
      avg != null ? `- Media recente: ${avg}/100.` : '- Sem pontuacao numerica suficiente.',
      `- Avancos/observacoes: ${reports.map((item) => item.learning_progress || item.learning_evidence || item.summary).filter(Boolean).slice(0, 3).join(' | ') || 'sem observacoes registradas'}.`,
      `- Pontos de reforco: ${reports.map((item) => item.detected_doubts || item.reinforcement_points).filter(Boolean).slice(0, 3).join(' | ') || 'sem dificuldades recorrentes registradas'}.`,
    ].join('\n');
  }

  private parentText(context: TeacherContext, studentName: string | undefined, topic: string) {
    const { student } = this.dataContext.findStudent(context, studentName);
    const name = student?.full_name || 'seu filho(a)';
    const text = normalize(topic);
    if (text.includes('faltou')) {
      return `Claro. Sugestao de mensagem:\n\nOla! Passando para avisar que ${name} nao compareceu a aula de hoje. Caso queira, podemos combinar um novo horario para repor o conteudo.`;
    }
    return `Claro. Sugestao de mensagem:\n\nOla! Tudo bem? Estou entrando em contato para compartilhar uma atualizacao sobre ${name}. Podemos alinhar os proximos passos para manter uma boa evolucao nos estudos.`;
  }

  private async prepareCreateClass(connection: BotConnection, context: TeacherContext, detected: DetectedIntent) {
    const { student, error } = this.dataContext.findStudent(context, detected.studentName);
    if (!student) return error || 'Nao encontrei esse aluno.';
    if (!detected.date || !detected.time) return `Para marcar a aula com ${student.full_name}, preciso da data e do horario. Exemplo: "amanha as 15h".`;
    const action: BotPendingAction = {
      type: 'CREATE_CLASS',
      intent: 'CRIAR_AULA',
      student_id: student.id,
      student_name: student.full_name,
      student_user_id: student.user_id,
      subject: student.subject,
      class_date: detected.date,
      class_time: detected.time,
      duration_minutes: 60,
      summary: `marcar aula com ${student.full_name} em ${formatDate(detected.date)} as ${formatTime(detected.time)}`,
    };
    await this.state.set(connection, action);
    return `Confirma ${action.summary}?`;
  }

  private async preparePayment(connection: BotConnection, context: TeacherContext, detected: DetectedIntent) {
    const { student, error } = this.dataContext.findStudent(context, detected.studentName);
    if (!student) return error || 'Nao encontrei esse aluno.';
    if (!detected.amount || detected.amount <= 0) return `Qual valor devo registrar para ${student.full_name}?`;
    const action: BotPendingAction = {
      type: 'REGISTER_PAYMENT',
      intent: 'REGISTRAR_PAGAMENTO',
      student_id: student.id,
      student_name: student.full_name,
      student_user_id: student.user_id,
      amount: detected.amount,
      month_reference: monthReference(),
      summary: `registrar pagamento de ${currency(detected.amount)} para ${student.full_name}`,
    };
    await this.state.set(connection, action);
    return `Confirma ${action.summary}?`;
  }

  private async prepareAbsence(connection: BotConnection, context: TeacherContext, detected: DetectedIntent) {
    const { student, error } = this.dataContext.findStudent(context, detected.studentName);
    if (!student) return error || 'Nao encontrei esse aluno.';
    const date = detected.date || todayDate();
    const action: BotPendingAction = {
      type: 'REGISTER_ABSENCE',
      intent: 'REGISTRAR_FALTA',
      student_id: student.id,
      student_name: student.full_name,
      class_date: date,
      summary: `registrar falta de ${student.full_name} em ${formatDate(date)}`,
    };
    await this.state.set(connection, action);
    return `Confirma ${action.summary}?`;
  }

  private async prepareNote(connection: BotConnection, context: TeacherContext, detected: DetectedIntent, originalMessage: string) {
    const { student, error } = this.dataContext.findStudent(context, detected.studentName);
    if (!student) return error || 'Para qual aluno devo criar essa anotacao?';
    const note = detected.note || originalMessage;
    const action: BotPendingAction = {
      type: 'CREATE_NOTE',
      intent: 'CRIAR_ANOTACAO_AULA',
      student_id: student.id,
      student_name: student.full_name,
      note,
      summary: `criar anotacao para ${student.full_name}: "${note.slice(0, 120)}"`,
    };
    await this.state.set(connection, action);
    return `Confirma ${action.summary}?`;
  }

  private async prepareDeleteHistory(connection: BotConnection) {
    const action: BotPendingAction = {
      type: 'DELETE_HISTORY',
      intent: 'APAGAR_HISTORICO',
      summary: 'apagar o historico de conversas do LuminaBot para sua conta',
    };
    await this.state.set(connection, action);
    return 'Confirma apagar seu historico de conversas do LuminaBot? Essa acao nao altera alunos, aulas ou pagamentos.';
  }

  private busyDays(classes: ClassLite[]) {
    const counts = new Map<string, number>();
    for (const item of classes) counts.set(item.class_date, (counts.get(item.class_date) || 0) + 1);
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([date, count]) => `${formatDate(date)} (${count})`)
      .join(', ');
  }
}
