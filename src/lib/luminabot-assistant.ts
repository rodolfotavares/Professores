import { deflateSync } from 'zlib';
import { supabaseAdmin } from './supabase-admin';
import { createOrUpdateGoogleEventForClass, deleteGoogleEventForClass, sendGmailMessage } from './google-calendar';

export type ConversationIntent =
  | 'CONSULTAR_AGENDA'
  | 'CRIAR_AULA'
  | 'ALTERAR_AULA'
  | 'CANCELAR_AULA'
  | 'REGISTRAR_PAGAMENTO'
  | 'CONSULTAR_FINANCEIRO'
  | 'GERAR_RELATORIO_FINANCEIRO'
  | 'GERAR_RELATORIO_ALUNOS'
  | 'LISTAR_PAGAMENTOS_PENDENTES'
  | 'LISTAR_ALUNOS'
  | 'LISTAR_PENDENCIAS'
  | 'REGISTRAR_FALTA'
  | 'CONSULTAR_ALUNO'
  | 'GERAR_RELATORIO_ALUNO'
  | 'CRIAR_ANOTACAO_AULA'
  | 'GERAR_TEXTO_PARA_PAIS_OU_ALUNO'
  | 'GERAR_MENSAGEM_PARA_RESPONSAVEL'
  | 'ENVIAR_EMAIL'
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
  email?: string | null;
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
      teacher_id?: string;
      telegram_user_id?: string | null;
      entities?: Record<string, unknown>;
      student_id: string;
      student_name: string;
      student_user_id: string | null;
      subject: string | null;
      class_date: string;
      class_time: string;
      duration_minutes: number;
      summary: string;
      expires_at?: string;
      status?: 'pending';
    }
  | {
      type: 'UPDATE_CLASS';
      intent: 'ALTERAR_AULA';
      teacher_id?: string;
      telegram_user_id?: string | null;
      entities?: Record<string, unknown>;
      class_id: string;
      student_name: string;
      class_date: string;
      class_time: string;
      summary: string;
      expires_at?: string;
      status?: 'pending';
    }
  | {
      type: 'CANCEL_CLASS';
      intent: 'CANCELAR_AULA';
      teacher_id?: string;
      telegram_user_id?: string | null;
      entities?: Record<string, unknown>;
      class_ids: string[];
      student_name?: string;
      class_date?: string;
      summary: string;
      expires_at?: string;
      status?: 'pending';
    }
  | {
      type: 'REGISTER_PAYMENT';
      intent: 'REGISTRAR_PAGAMENTO';
      teacher_id?: string;
      telegram_user_id?: string | null;
      entities?: Record<string, unknown>;
      student_id: string;
      student_name: string;
      student_user_id: string | null;
      amount: number;
      month_reference: string;
      summary: string;
      expires_at?: string;
      status?: 'pending';
    }
  | {
      type: 'REGISTER_ABSENCE';
      intent: 'REGISTRAR_FALTA';
      teacher_id?: string;
      telegram_user_id?: string | null;
      entities?: Record<string, unknown>;
      student_id: string;
      student_name: string;
      class_date: string;
      summary: string;
      expires_at?: string;
      status?: 'pending';
    }
  | {
      type: 'CREATE_NOTE';
      intent: 'CRIAR_ANOTACAO_AULA';
      teacher_id?: string;
      telegram_user_id?: string | null;
      entities?: Record<string, unknown>;
      student_id: string;
      student_name: string;
      note: string;
      summary: string;
      expires_at?: string;
      status?: 'pending';
    }
  | {
      type: 'SEND_EMAIL';
      intent: 'ENVIAR_EMAIL';
      teacher_id?: string;
      telegram_user_id?: string | null;
      entities?: Record<string, unknown>;
      student_id: string;
      student_name: string;
      to: string;
      subject: string;
      body: string;
      summary: string;
      expires_at?: string;
      status?: 'pending';
    }
  | {
      type: 'DELETE_HISTORY';
      intent: 'APAGAR_HISTORICO';
      teacher_id?: string;
      telegram_user_id?: string | null;
      entities?: Record<string, unknown>;
      summary: string;
      expires_at?: string;
      status?: 'pending';
    };

type DetectedIntent = {
  intent: ConversationIntent;
  studentName?: string;
  date?: string;
  time?: string;
  amount?: number;
  period?: string;
  reportType?: string;
  artifactType?: 'spreadsheet' | 'chart' | 'document';
  artifactDelivery?: 'document' | 'photo';
  note?: string;
  topic?: string;
  needsClarification?: string;
};

type InterpretationResult = DetectedIntent & {
  confidence: number;
  source: 'local_rules' | 'training_example' | 'llm' | 'fallback';
  missing_fields?: string[];
  natural_response?: string;
  training_example_id?: string;
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
  interpret?(input: { message: string; normalizedMessage: string; context: string; localResult?: InterpretationResult | null }): Promise<InterpretationResult | null>;
}

class DisabledLLMProvider implements LLMProvider {
  isConfigured() {
    return false;
  }

  async complete() {
    return null;
  }

  async interpret() {
    return null;
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

function pendingExpiration() {
  return new Date(Date.now() + 10 * 60 * 1000).toISOString();
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[“”"']/g, '')
    .replace(/\s+/g, ' ')
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
  const weekdays: Record<string, number> = {
    domingo: 0,
    segunda: 1,
    terca: 2,
    quarta: 3,
    quinta: 4,
    sexta: 5,
    sabado: 6,
  };
  if (normalized.includes('depois de amanha')) return addDays(today, 2);
  if (normalized.includes('amanha')) return addDays(today, 1);
  if (normalized.includes('ontem')) return addDays(today, -1);
  for (const [name, target] of Object.entries(weekdays)) {
    if (normalized.includes(name)) {
      const current = new Date(`${today}T12:00:00`);
      const currentDay = current.getDay();
      let diff = target - currentDay;
      if (diff <= 0 || normalized.includes('proxim')) diff += 7;
      return addDays(today, diff);
    }
  }
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
  if (normalized.includes('duas da tarde')) return '14:00:00';
  if (normalized.includes('tres da tarde')) return '15:00:00';
  if (normalized.includes('quatro da tarde')) return '16:00:00';
  if (normalized.includes('cinco da tarde')) return '17:00:00';
  if (normalized.includes('seis da tarde')) return '18:00:00';
  if (normalized.includes('periodo da tarde') || normalized.includes('de tarde')) return '14:00:00';
  if (normalized.includes('de manha') || normalized.includes('pela manha')) return '09:00:00';
  const match = normalized.match(/\b(?:as|a|para)?\s*(\d{1,2})(?::|h)(\d{2})?\b/) || normalized.match(/\b(?:as|a)\s+(\d{1,2})\b/);
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
  return ['nao', 'n', 'cancelar', 'cancela', 'deixa', 'deixa pra la', 'esquece'].includes(normalize(text));
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

function compactLines(lines: Array<string | false | null | undefined>) {
  return lines.filter(Boolean).join('\n');
}

function botMessage(lines: Array<string | false | null | undefined>) {
  return compactLines(lines).replace(/\n{3,}/g, '\n\n').trim();
}

function bullet(label: string, value?: string | number | null) {
  return value === undefined || value === null || value === '' ? `- ${label}` : `- ${label}: ${value}`;
}

async function safeGoogleSync(action: () => Promise<{ synced: boolean; action?: string; reason?: string }>) {
  try {
    const result = await action();
    if (result.synced) return '- Google Agenda: sincronizado.';
    if (result.reason === 'not_connected') return '- Google Agenda: nao conectado.';
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'nao foi possivel sincronizar.';
    return `- Google Agenda: ${message}`;
  }
}

function escapeXml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type SpreadsheetCell = string | number | boolean | null | undefined;

type SpreadsheetSheet = {
  name: string;
  title: string;
  headers: string[];
  rows: SpreadsheetCell[][];
  summary?: Array<[string, SpreadsheetCell]>;
};

function spreadsheetXmlContent(sheets: SpreadsheetSheet[]) {
  const styles = `
  <Styles>
    <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="16" ss:Color="#06133A"/><Interior ss:Color="#DCEBFF" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#2563EB" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1D4ED8"/></Borders></Style>
    <Style ss:ID="Text"><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>
    <Style ss:ID="Number"><NumberFormat ss:Format="#,##0.00"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>
    <Style ss:ID="SummaryLabel"><Font ss:Bold="1" ss:Color="#0F172A"/><Interior ss:Color="#EFF6FF" ss:Pattern="Solid"/></Style>
    <Style ss:ID="SummaryValue"><Font ss:Bold="1" ss:Color="#0F172A"/><NumberFormat ss:Format="#,##0.00"/><Interior ss:Color="#EFF6FF" ss:Pattern="Solid"/></Style>
  </Styles>`;
  const worksheets = sheets.map((sheet) => {
    const columnCount = Math.max(sheet.headers.length, 2);
    const columns = Array.from({ length: columnCount }, () => '<Column ss:AutoFitWidth="1" ss:Width="145"/>').join('');
    const summaryRows = (sheet.summary || [])
      .map(
        ([label, value]) =>
          `<Row><Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">${escapeXml(label)}</Data></Cell><Cell ss:StyleID="SummaryValue">${spreadsheetData(value)}</Cell></Row>`
      )
      .join('');
    const headerRow = `<Row>${sheet.headers.map((header) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`).join('')}</Row>`;
    const dataRows = sheet.rows
      .map((row) => `<Row>${row.map((cell) => `<Cell ss:StyleID="${typeof cell === 'number' ? 'Number' : 'Text'}">${spreadsheetData(cell)}</Cell>`).join('')}</Row>`)
      .join('');
    return `<Worksheet ss:Name="${escapeXml(sheet.name.slice(0, 31))}">
      <Table>${columns}
        <Row><Cell ss:MergeAcross="${Math.max(0, columnCount - 1)}" ss:StyleID="Title"><Data ss:Type="String">${escapeXml(sheet.title)}</Data></Cell></Row>
        <Row></Row>
        ${summaryRows}
        ${summaryRows ? '<Row></Row>' : ''}
        ${headerRow}
        ${dataRows}
      </Table>
      <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>4</SplitHorizontal><TopRowBottomPane>4</TopRowBottomPane></WorksheetOptions>
    </Worksheet>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 ${styles}
 ${worksheets.join('\n')}
</Workbook>`;
}

function spreadsheetData(value: SpreadsheetCell) {
  if (typeof value === 'number' && Number.isFinite(value)) return `<Data ss:Type="Number">${value}</Data>`;
  if (typeof value === 'boolean') return `<Data ss:Type="Boolean">${value ? 1 : 0}</Data>`;
  return `<Data ss:Type="String">${escapeXml(value ?? '')}</Data>`;
}

function safeFilename(value: string) {
  return (
    normalize(value)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'relatorio'
  );
}

function detectArtifactType(text: string): DetectedIntent['artifactType'] {
  if (text.includes('planilha') || text.includes('excel') || text.includes('csv')) return 'spreadsheet';
  if (text.includes('grafico') || text.includes('imagem') || text.includes('foto') || text.includes('png')) return 'chart';
  if (text.includes('documento') || text.includes('arquivo') || text.includes('pdf')) return 'document';
  return undefined;
}

function detectArtifactDelivery(text: string): DetectedIntent['artifactDelivery'] {
  return text.includes('foto') || text.includes('imagem') || text.includes('png') ? 'photo' : 'document';
}

function artifactLabel(type?: DetectedIntent['artifactType']) {
  if (type === 'spreadsheet') return 'planilha';
  if (type === 'chart') return 'grafico';
  if (type === 'document') return 'documento';
  return 'relatorio';
}

function artifactFormat(type?: DetectedIntent['artifactType'], delivery?: DetectedIntent['artifactDelivery']) {
  if (type === 'spreadsheet') return 'XLS';
  if (type === 'chart') return delivery === 'photo' ? 'PNG' : 'SVG';
  if (type === 'document') return 'TXT';
  return 'texto';
}

function simpleBarChartSvg(input: { title: string; rows: Array<{ label: string; value: number; color: string }> }) {
  const width = 920;
  const height = 420;
  const max = Math.max(1, ...input.rows.map((row) => row.value));
  const chartTop = 86;
  const chartLeft = 170;
  const barHeight = 44;
  const gap = 34;
  const chartWidth = 640;
  const lines = input.rows.map((row, index) => {
    const y = chartTop + index * (barHeight + gap);
    const barWidth = Math.max(10, Math.round((row.value / max) * chartWidth));
    return `
      <text x="32" y="${y + 29}" fill="#0f172a" font-size="22" font-family="Arial">${escapeXml(row.label)}</text>
      <rect x="${chartLeft}" y="${y}" width="${chartWidth}" height="${barHeight}" rx="14" fill="#e5edff"/>
      <rect x="${chartLeft}" y="${y}" width="${barWidth}" height="${barHeight}" rx="14" fill="${escapeXml(row.color)}"/>
      <text x="${chartLeft + barWidth + 18}" y="${y + 29}" fill="#0f172a" font-size="20" font-family="Arial">${escapeXml(currency(row.value))}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" rx="28" fill="#f8fbff"/>
  <text x="32" y="48" fill="#06133a" font-size="30" font-weight="700" font-family="Arial">${escapeXml(input.title)}</text>
  ${lines.join('\n')}
</svg>`;
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function simpleBarChartPng(input: { rows: Array<{ value: number; color: string }> }) {
  const width = 900;
  const height = 420;
  const data = Buffer.alloc((width * 4 + 1) * height);
  const max = Math.max(1, ...input.rows.map((row) => row.value));
  const colors = input.rows.map((row) => hexToRgb(row.color));
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    data[rowStart] = 0;
    for (let x = 0; x < width; x += 1) {
      const offset = rowStart + 1 + x * 4;
      data[offset] = 248;
      data[offset + 1] = 251;
      data[offset + 2] = 255;
      data[offset + 3] = 255;
    }
  }
  input.rows.forEach((row, index) => {
    const barWidth = Math.max(8, Math.round((row.value / max) * 620));
    const x = 190;
    const y = 80 + index * 90;
    drawRect(data, width, x, y, 620, 42, { r: 226, g: 237, b: 255 });
    drawRect(data, width, x, y, barWidth, 42, colors[index]);
  });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(data)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function hexToRgb(value: string) {
  const normalized = value.replace('#', '');
  return {
    r: parseInt(normalized.slice(0, 2), 16) || 37,
    g: parseInt(normalized.slice(2, 4), 16) || 99,
    b: parseInt(normalized.slice(4, 6), 16) || 235,
  };
}

function drawRect(data: Buffer, width: number, x: number, y: number, rectWidth: number, rectHeight: number, color: { r: number; g: number; b: number }) {
  for (let yy = Math.max(0, y); yy < Math.min(420, y + rectHeight); yy += 1) {
    for (let xx = Math.max(0, x); xx < Math.min(width, x + rectWidth); xx += 1) {
      const offset = yy * (width * 4 + 1) + 1 + xx * 4;
      data[offset] = color.r;
      data[offset + 1] = color.g;
      data[offset + 2] = color.b;
      data[offset + 3] = 255;
    }
  }
}

async function telegramSendDocument(
  connection: BotConnection,
  file: { filename: string; content: string | Buffer; contentType: string; caption: string }
) {
  if (!connection.telegram_chat_id || !process.env.TELEGRAM_BOT_TOKEN) return false;
  try {
    const formData = new FormData();
    formData.append('chat_id', connection.telegram_chat_id);
    formData.append('caption', file.caption.slice(0, 1024));
    const content: BlobPart = typeof file.content === 'string' ? file.content : new Uint8Array(file.content);
    formData.append('document', new Blob([content], { type: file.contentType }), file.filename);
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendDocument`, {
      method: 'POST',
      body: formData,
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function telegramSendPhoto(
  connection: BotConnection,
  file: { filename: string; content: Buffer; contentType: string; caption: string }
) {
  if (!connection.telegram_chat_id || !process.env.TELEGRAM_BOT_TOKEN) return false;
  try {
    const formData = new FormData();
    formData.append('chat_id', connection.telegram_chat_id);
    formData.append('caption', file.caption.slice(0, 1024));
    const content: BlobPart = new Uint8Array(file.content);
    formData.append('photo', new Blob([content], { type: file.contentType }), file.filename);
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });
    return response.ok;
  } catch {
    return false;
  }
}

function shortStatus(status?: string | null) {
  if (status === 'scheduled') return 'agendada';
  if (status === 'completed') return 'concluida';
  if (status === 'cancelled') return 'cancelada';
  if (status === 'absence') return 'falta registrada';
  if (status === 'paid') return 'pago';
  if (status === 'pending') return 'pendente';
  return status || 'sem status';
}

export class EntityExtractionService {
  extract(message: string) {
    const raw = message.trim();
    const text = normalize(raw);
    return {
      studentName: this.studentName(raw),
      date: this.hasDate(text) ? parseDate(raw) : undefined,
      time: parseTime(raw) || undefined,
      amount: this.amount(raw),
      period: this.period(text),
      reportType: this.reportType(text),
      artifactType: detectArtifactType(text),
      artifactDelivery: detectArtifactDelivery(text),
      note: this.note(raw),
      topic: raw,
    };
  }

  private studentName(message: string) {
    const raw = message.trim();
    const emailTarget = raw.match(/(?:e-mail|email).*?(?:para|ao|a)\s+([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)?)(?:\s+(?:confirmando|avisando|cobrando|sobre|que|para)|\s*$)/i);
    if (emailTarget?.[1]) return emailTarget[1].trim();
    const afterAmount = raw.match(/(?:pagamento|pagou|recebi|recebido|valor|mensalidade).*?(?:para|do|da|de)\s+([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)?)(?:\s|$)/i);
    if (afterAmount?.[1] && !/reais|real|valor|aula|mensalidade/i.test(afterAmount[1])) {
      return afterAmount[1].replace(/\s+(do|da|de|com|para)$/i, '').trim();
    }
    const patterns = [
      /^(?:agenda|agende|marca|marque|coloca|coloque|cria|crie)\s+(?:o|a|aluno|aluna)?\s*(.+?)(?:\s+(?:na agenda|no horario|para|amanh|hoje|ontem|segunda|terca|quarta|quinta|sexta|sabado|domingo|as|a\s+\d|de manha|de tarde|periodo da tarde)|$)/i,
      /(?:aula|pagamento|relatorio|falta|mensagem|anotacao)\s+(?:do|da|de|com|para|sobre)\s+(.+?)(?:\s+(?:para|amanh|hoje|ontem|segunda|terca|quarta|quinta|sexta|sabado|domingo|as|a\s+\d|de\s+r?\$|de\s+\d|\d+[,.]?\d*\s*(?:reais|real))|$)/i,
      /(?:do|da|de|com|para|sobre)\s+(.+?)(?:\s+(?:para|amanh|hoje|ontem|segunda|terca|quarta|quinta|sexta|sabado|domingo|as|a\s+\d|de\s+r?\$|de\s+\d|\d+[,.]?\d*\s*(?:reais|real))|$)/i,
      /^(.+?)\s+(?:pagou|nao veio|nao compareceu)\b/i,
      /^(.+?)\s+faltou\b/i,
    ];
    for (const pattern of patterns) {
      const match = raw.match(pattern);
      const value = match?.[1]?.trim();
      if (value) {
        return value
          .replace(/\b(aula|pagamento|relatorio|aluno|aluna)\b/gi, '')
          .trim()
          .replace(/^(do|da|de|com|para)\s+/i, '')
          .replace(/\s+(do|da|de|com|para)$/i, '')
          .trim();
      }
    }
    return undefined;
  }

  private amount(message: string) {
    const normalized = normalize(message);
    const match = normalized.match(/(?:r\$\s*)?(\d{1,6}(?:[.,]\d{1,2})?)\s*(?:reais|real|rs|r\$)?/);
    if (!match) return undefined;
    const value = Number(match[1].replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(value) ? value : undefined;
  }

  private period(text: string) {
    if (text.includes('mes passado')) return 'mes passado';
    if (text.includes('este mes') || text.includes('mes atual') || text.includes('mensal')) return 'mes atual';
    if (text.includes('ano atual') || text.includes('este ano') || text.includes('anual')) return 'ano atual';
    if (text.includes('proxima semana') || text.includes('semana que vem')) return 'proxima semana';
    if (text.includes('semana')) return 'semana atual';
    return 'mes atual';
  }

  private reportType(text: string) {
    if (text.includes('financeiro')) return 'financeiro';
    if (text.includes('dos alunos') || text.includes('geral dos alunos')) return 'alunos';
    if (text.includes('relatorio do') || text.includes('relatorio da')) return 'aluno';
    return undefined;
  }

  private note(message: string) {
    const match = message.match(/:\s*(.+)$/);
    return match?.[1]?.trim();
  }

  private hasDate(text: string) {
    return /(hoje|amanha|ontem|segunda|terca|quarta|quinta|sexta|sabado|domingo|\d{1,2}[/-]\d{1,2})/.test(text);
  }
}

export class DateTimeParserPTBR {
  normalize(value: string) {
    return normalize(value);
  }

  parseDate(value: string) {
    return parseDate(value);
  }

  parseTime(value: string) {
    return parseTime(value);
  }
}

export class IntentDetectionService {
  private entityExtractor = new EntityExtractionService();

  detect(message: string): DetectedIntent {
    const raw = message.trim();
    const text = normalize(raw);
    const entities = this.entityExtractor.extract(raw);

    if (
      /(quanto|quem|quais|qual|me mostra|mostra|resumo|financeiro|faturamento|recebimentos|devendo|pendente|atrasado|receber)/.test(text) &&
      /(recebi|receber|financeiro|faturamento|pagamento|pagamentos|devendo|pendente|atrasado|recebimentos)/.test(text)
    ) {
      if (text.includes('planilha') || text.includes('grafico') || text.includes('pdf') || text.includes('imagem') || text.includes('relatorio')) return { intent: 'GERAR_RELATORIO_FINANCEIRO', ...entities };
      if (text.includes('pendente') || text.includes('atrasado') || text.includes('devendo')) return { intent: 'LISTAR_PENDENCIAS', ...entities };
      return { intent: 'CONSULTAR_FINANCEIRO', ...entities };
    }
    if (/(envie|enviar|mande|mandar|dispare|disparar).*(e-mail|email)/.test(text) || /(e-mail|email).*(para|ao aluno|a aluna|responsavel|responsavel)/.test(text)) {
      return { intent: 'ENVIAR_EMAIL', ...entities, studentName: entities.studentName || this.extractStudentName(raw), topic: raw, needsClarification: !entities.studentName ? 'missing_student' : undefined };
    }
    if (/(crie|cria|escreva|faca|transforme).*(mensagem|aviso|comunicado)/.test(text) || text.includes('mensagem cobrando') || text.includes('mensagem confirmando')) {
      return { intent: 'GERAR_TEXTO_PARA_PAIS_OU_ALUNO', ...entities, studentName: entities.studentName || this.extractStudentName(raw), topic: raw };
    }
    if (/(muda|mude|remarca|remarque|troca|altera|alterar|passa|reagenda|reagende)/.test(text) && (text.includes('aula') || text.includes('horario'))) {
      return { intent: 'ALTERAR_AULA', ...entities, needsClarification: !entities.studentName ? 'missing_student' : undefined };
    }
    if (/(cancela|cancelar|desmarca|desmarque|remove|remova|tira|tire)/.test(text) && (text.includes('aula') || text.includes('horario') || text.includes('agenda'))) {
      return { intent: 'CANCELAR_AULA', ...entities };
    }
    if (text.includes('planilha') || text.includes('grafico') || text.includes('pdf') || text.includes('imagem') || text.includes('relatorio anual') || text.includes('relatorio completo do mes')) {
      if (text.includes('desempenho') || text.includes('evolucao') || text.includes('historico')) return { intent: 'GERAR_RELATORIO_ALUNO', ...entities, studentName: entities.studentName || this.extractStudentName(raw) };
      return { intent: text.includes('pagamento') || text.includes('financeiro') || text.includes('recebimento') ? 'GERAR_RELATORIO_FINANCEIRO' : 'GERAR_RELATORIO_ALUNOS', ...entities };
    }
    if (/(faltou|falta|ausencia|nao veio|nao compareceu|nao vai vir)/.test(text)) {
      return { intent: 'REGISTRAR_FALTA', ...entities, date: entities.date || parseDate(raw), needsClarification: !entities.studentName ? 'missing_student' : undefined };
    }
    if (
      (/\b(marcar|marque|marca|agendar|agende|criar aula|crie aula|cria uma aula|cria aula|coloca aula|coloque aula)\b/.test(text) && text.includes('aula')) ||
      (text.includes('agenda a aula') && text.includes('aula')) ||
      (/^(coloca|coloque|marca|marque|agenda|agende)\b/.test(text) && text.includes('agenda') && !!entities.studentName) ||
      (/^(coloca|coloque|marca|marque|agenda|agende)\b/.test(text) && !!entities.studentName && (!!entities.date || !!entities.time))
    ) {
      return { intent: 'CRIAR_AULA', ...entities, needsClarification: !entities.studentName || !entities.date || !entities.time ? 'missing_class_data' : undefined };
    }
    if (/(registrar pagamento|registra pagamento|registre pagamento|anota pagamento|anote pagamento|adiciona pagamento|coloca pagamento|marca pagamento|pagou|recebi)/.test(text)) {
      return { intent: 'REGISTRAR_PAGAMENTO', ...entities, needsClarification: !entities.studentName || !entities.amount ? 'missing_payment_data' : undefined };
    }
    if (text.includes('relatorio financeiro')) return { intent: 'GERAR_RELATORIO_FINANCEIRO', ...entities };
    if (text.includes('relatorio dos alunos') || text.includes('relatorio geral dos alunos')) return { intent: 'GERAR_RELATORIO_ALUNOS', ...entities };
    if (text.includes('evolucao') || text.includes('desempenho') || text.includes('historico') || text.includes('relatorio mensal da') || text.includes('relatorio mensal do') || text.includes('relatorio profissional')) {
      return { intent: 'GERAR_RELATORIO_ALUNO', ...entities, studentName: entities.studentName || this.extractStudentName(raw) };
    }
    if ((text.includes('planilha') || text.includes('alunos ativos')) && text.includes('alunos')) return { intent: 'GERAR_RELATORIO_ALUNOS', ...entities };
    if (text.includes('relatorio do') || text.includes('relatorio da') || /relatorio\s+.+\s+(do|da)\b/.test(text)) return { intent: 'GERAR_RELATORIO_ALUNO', ...entities, needsClarification: !entities.studentName ? 'missing_student' : undefined };
    if (
      text.includes('minha agenda') ||
      text.includes('agenda de hoje') ||
      text.includes('quais aulas') ||
      text.includes('como esta minha agenda') ||
      text.includes('aulas tenho') ||
      text.includes('tenho aula') ||
      (text.includes('horarios') && text.includes('livres')) ||
      text.includes('proximas aulas') ||
      text.includes('compromissos') ||
      text.includes('aula marcada') ||
      text.includes('aluno marcado') ||
      text.includes('agenda da semana') ||
      text.includes('agenda do mes')
    ) {
      return { intent: 'CONSULTAR_AGENDA', ...entities, date: entities.date || parseDate(raw) };
    }
    if (text.includes('listar alunos') || text === 'alunos' || text.includes('meus alunos')) return { intent: 'LISTAR_ALUNOS', ...entities };
    if (text.includes('pendencias') || text.includes('pagamento atrasado') || text.includes('pagamentos atrasados') || text.includes('pagamento pendente') || text.includes('quem esta devendo')) {
      return { intent: 'LISTAR_PENDENCIAS', ...entities };
    }

    if (['/start', '/ajuda', 'ajuda', 'help', 'comandos'].includes(text) || text.includes('o que voce faz') || text.includes('consegue fazer')) return { intent: 'PEDIR_AJUDA' };
    if (text.includes('apagar historico') || text.includes('limpar historico') || text.includes('excluir historico')) return { intent: 'APAGAR_HISTORICO' };
    if (text.includes('agenda') || text.includes('aulas de hoje') || text.includes('minhas aulas')) return { intent: 'CONSULTAR_AGENDA', date: parseDate(raw) };
    if (text.includes('organizar minha semana') || text.includes('organize minha semana') || text.includes('planejar semana') || text.includes('resolver hoje') || text.includes('melhorar minha rotina') || text.includes('resumo geral da minha semana')) return { intent: 'ORGANIZAR_SEMANA' };
    if (text.includes('pagamento atrasado') || text.includes('pagamentos atrasados') || text.includes('pagamento pendente') || text.includes('quem esta devendo')) return { intent: 'LISTAR_PAGAMENTOS_PENDENTES' };
    if (text.includes('financeiro') || text.includes('ganhos') || text.includes('recebi') || text.includes('resumo do mes')) return { intent: 'CONSULTAR_FINANCEIRO' };
    if (text.includes('precisam de mais atencao') || text.includes('dificuldade') || text.includes('dificuldades')) return { intent: 'RESUMIR_DADOS' };
    if (text.includes('evolucao') || text.includes('desempenho') || text.includes('historico')) return { intent: 'GERAR_RELATORIO_ALUNO', studentName: this.extractStudentName(raw) || entities.studentName };
    if (text.includes('relatorio da aula') || text.includes('relatorio de aula')) return { intent: 'CRIAR_ANOTACAO_AULA', studentName: this.extractStudentName(raw), note: raw };
    if (text.includes('mensagem') || text.includes('avisar') || text.includes('aviso') || text.includes('comunicado') || text.includes('mae') || text.includes('responsavel')) return { intent: 'GERAR_TEXTO_PARA_PAIS_OU_ALUNO', studentName: this.extractStudentName(raw) || entities.studentName, topic: raw };

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

export class LocalRuleParser {
  private detector = new IntentDetectionService();

  parse(message: string): InterpretationResult {
    const detected = this.detector.detect(message);
    const missing = this.missingFields(detected);
    return {
      ...detected,
      confidence: this.confidence(detected, missing),
      source: 'local_rules',
      missing_fields: missing,
    };
  }

  private confidence(detected: DetectedIntent, missing: string[]) {
    if (detected.intent === 'CONVERSA_GERAL') return 0.25;
    if (detected.intent === 'PEDIR_AJUDA') return 0.95;
    if (missing.length) return 0.88;
    if (['CRIAR_AULA', 'ALTERAR_AULA', 'CANCELAR_AULA', 'REGISTRAR_PAGAMENTO', 'REGISTRAR_FALTA'].includes(detected.intent)) return 0.93;
    return 0.9;
  }

  private missingFields(detected: DetectedIntent) {
    const missing: string[] = [];
    if (detected.intent === 'CRIAR_AULA') {
      if (!detected.studentName) missing.push('studentName');
      if (!detected.date) missing.push('date');
      if (!detected.time) missing.push('time');
    }
    if (detected.intent === 'ALTERAR_AULA' && !detected.studentName) missing.push('studentName');
    if (detected.intent === 'REGISTRAR_PAGAMENTO') {
      if (!detected.studentName) missing.push('studentName');
      if (!detected.amount) missing.push('amount');
    }
    if (detected.intent === 'REGISTRAR_FALTA' && !detected.studentName) missing.push('studentName');
    if (detected.intent === 'GERAR_RELATORIO_ALUNO' && !detected.studentName) missing.push('studentName');
    return missing;
  }
}

type TrainingExampleRow = {
  id: string;
  teacher_id: string;
  phrase: string;
  normalized_phrase: string;
  intent: ConversationIntent;
  entities: Record<string, unknown> | null;
  confidence: number | null;
  status: string | null;
};

function tokenSet(value: string) {
  return new Set(normalize(value).split(' ').filter((item) => item.length > 2));
}

function similarityScore(a: string, b: string) {
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const item of left) if (right.has(item)) intersection += 1;
  const union = new Set([...left, ...right]).size;
  return intersection / union;
}

export class TrainingExampleService {
  async findSimilar(teacherId: string, message: string): Promise<InterpretationResult | null> {
    try {
      const normalizedMessage = normalize(message);
      const { data, error } = await supabaseAdmin
        .from('luminabot_training_examples')
        .select('id, teacher_id, phrase, normalized_phrase, intent, entities, confidence, status')
        .eq('teacher_id', teacherId)
        .in('status', ['approved', 'auto'])
        .limit(80);
      if (error) return null;
      const examples = (data || []) as TrainingExampleRow[];
      let best: { example: TrainingExampleRow; score: number } | null = null;
      for (const example of examples) {
        const score = example.normalized_phrase === normalizedMessage ? 1 : similarityScore(example.normalized_phrase, normalizedMessage);
        if (!best || score > best.score) best = { example, score };
      }
      if (!best || best.score < 0.86) return null;
      const entities = (best.example.entities || {}) as Partial<DetectedIntent>;
      return {
        intent: best.example.intent,
        ...entities,
        confidence: Math.max(best.score, Number(best.example.confidence || 0.9)),
        source: 'training_example',
        missing_fields: [],
        training_example_id: best.example.id,
      };
    } catch {
      return null;
    }
  }

  async save(input: {
    teacherId: string;
    phrase: string;
    interpretation: InterpretationResult | DetectedIntent;
    status?: 'auto' | 'pending_review' | 'approved' | 'rejected';
    source?: string;
  }) {
    try {
      const normalizedPhrase = normalize(input.phrase);
      if (!normalizedPhrase || input.interpretation.intent === 'CONVERSA_GERAL') return;
      const entities = { ...input.interpretation };
      delete (entities as any).confidence;
      delete (entities as any).source;
      delete (entities as any).natural_response;
      delete (entities as any).missing_fields;
      const { data: existing } = await supabaseAdmin
        .from('luminabot_training_examples')
        .select('id')
        .eq('teacher_id', input.teacherId)
        .eq('normalized_phrase', normalizedPhrase)
        .maybeSingle();
      const row = {
        teacher_id: input.teacherId,
        phrase: input.phrase.slice(0, 500),
        normalized_phrase: normalizedPhrase,
        intent: input.interpretation.intent,
        entities,
        confidence: 'confidence' in input.interpretation ? Number((input.interpretation as InterpretationResult).confidence || 0.9) : 0.9,
        source: input.source || ('source' in input.interpretation ? (input.interpretation as InterpretationResult).source : 'local_rules'),
        status: input.status || 'auto',
        updated_at: new Date().toISOString(),
      };
      if (existing?.id) {
        await supabaseAdmin.from('luminabot_training_examples').update(row).eq('id', existing.id).eq('teacher_id', input.teacherId);
      } else {
        await supabaseAdmin.from('luminabot_training_examples').insert(row);
      }
    } catch {
      // The bot must continue working even if the training table has not been migrated yet.
    }
  }
}

export class ExampleSimilarityMatcher {
  constructor(private examples = new TrainingExampleService()) {}

  match(teacherId: string, message: string) {
    return this.examples.findSimilar(teacherId, message);
  }
}

function coerceIntent(value: unknown): ConversationIntent {
  const allowed: ConversationIntent[] = [
    'CONSULTAR_AGENDA',
    'CRIAR_AULA',
    'ALTERAR_AULA',
    'CANCELAR_AULA',
    'REGISTRAR_PAGAMENTO',
    'CONSULTAR_FINANCEIRO',
    'GERAR_RELATORIO_FINANCEIRO',
    'GERAR_RELATORIO_ALUNOS',
    'LISTAR_PAGAMENTOS_PENDENTES',
    'LISTAR_ALUNOS',
    'LISTAR_PENDENCIAS',
    'REGISTRAR_FALTA',
    'CONSULTAR_ALUNO',
    'GERAR_RELATORIO_ALUNO',
    'CRIAR_ANOTACAO_AULA',
    'GERAR_TEXTO_PARA_PAIS_OU_ALUNO',
    'GERAR_MENSAGEM_PARA_RESPONSAVEL',
    'ENVIAR_EMAIL',
    'ORGANIZAR_SEMANA',
    'RESUMIR_DADOS',
    'PEDIR_AJUDA',
    'APAGAR_HISTORICO',
    'CONVERSA_GERAL',
  ];
  return allowed.includes(value as ConversationIntent) ? (value as ConversationIntent) : 'CONVERSA_GERAL';
}

function coerceArtifactType(value: unknown): DetectedIntent['artifactType'] {
  return value === 'spreadsheet' || value === 'chart' || value === 'document' ? value : undefined;
}

function coerceArtifactDelivery(value: unknown): DetectedIntent['artifactDelivery'] {
  return value === 'photo' || value === 'document' ? value : undefined;
}

function validateLLMInterpretation(payload: any): InterpretationResult | null {
  if (!payload || typeof payload !== 'object') return null;
  const entities = payload.entities && typeof payload.entities === 'object' ? payload.entities : {};
  const confidence = Math.max(0, Math.min(1, Number(payload.confidence || 0)));
  return {
    intent: coerceIntent(payload.intent),
    studentName: typeof entities.studentName === 'string' ? entities.studentName : typeof entities.student_name === 'string' ? entities.student_name : undefined,
    date: typeof entities.date === 'string' ? entities.date : undefined,
    time: typeof entities.time === 'string' ? entities.time : undefined,
    amount: typeof entities.amount === 'number' ? entities.amount : undefined,
    period: typeof entities.period === 'string' ? entities.period : undefined,
    reportType: typeof entities.reportType === 'string' ? entities.reportType : typeof entities.report_type === 'string' ? entities.report_type : undefined,
    artifactType: coerceArtifactType(entities.artifactType) || coerceArtifactType(entities.artifact_type),
    artifactDelivery: coerceArtifactDelivery(entities.artifactDelivery) || coerceArtifactDelivery(entities.artifact_delivery),
    note: typeof entities.note === 'string' ? entities.note : undefined,
    topic: typeof entities.topic === 'string' ? entities.topic : undefined,
    confidence,
    source: 'llm',
    missing_fields: Array.isArray(payload.missing_fields) ? payload.missing_fields.filter((item: unknown) => typeof item === 'string') : [],
    natural_response: typeof payload.natural_response === 'string' ? payload.natural_response : undefined,
  };
}

export class GroqLLMProvider implements LLMProvider {
  private apiKey = process.env.GROQ_API_KEY || '';
  private model = process.env.LLM_MODEL || 'llama-3.1-8b-instant';

  isConfigured() {
    return Boolean(this.apiKey && (process.env.LLM_PROVIDER || '').toLowerCase() === 'groq');
  }

  async complete() {
    return null;
  }

  async interpret(input: { message: string; normalizedMessage: string; context: string; localResult?: InterpretationResult | null }) {
    if (!this.isConfigured()) return null;
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'Voce interpreta mensagens de professores particulares para a LuminaAI. Responda somente JSON valido com: intent, entities, confidence, missing_fields e natural_response. Nunca execute acoes. Use apenas os dados fornecidos. Se o professor pedir planilha, grafico ou documento, preencha entities.artifactType com spreadsheet, chart ou document. Se pedir grafico como foto, imagem ou png, preencha entities.artifactDelivery com photo. Se tiver duvida, reduza a confidence.',
            },
            {
              role: 'user',
              content: JSON.stringify({
                message: input.message,
                normalized_message: input.normalizedMessage,
                local_result: input.localResult,
                context: input.context.slice(0, 6000),
              }),
            },
          ],
        }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) return null;
      return validateLLMInterpretation(JSON.parse(content));
    } catch {
      return null;
    }
  }
}

export class NaturalLanguageInterpreterService {
  private localParser = new LocalRuleParser();
  private matcher = new ExampleSimilarityMatcher();

  constructor(private llm: LLMProvider = createLLMProvider()) {}

  async interpret(connection: BotConnection, message: string, context: TeacherContext): Promise<InterpretationResult> {
    const normalizedMessage = normalize(message);
    const local = this.localParser.parse(message);
    if (local.confidence >= 0.85) return local;

    const example = await this.matcher.match(connection.teacher_id, message);
    if (example && example.confidence >= 0.85) return example;

    const llmResult = await this.llm.interpret?.({
      message,
      normalizedMessage,
      context: contextSummary(context),
      localResult: local,
    });
    if (llmResult && llmResult.confidence >= 0.6) return llmResult;

    return {
      ...local,
      source: 'fallback',
      natural_response: this.llm.isConfigured()
        ? 'Nao consegui interpretar com seguranca. Posso tentar de novo se voce enviar aluno, data, horario ou valor.'
        : 'Estou usando apenas as regras locais no momento. Envie a mensagem com aluno, data, horario ou valor para eu entender melhor.',
    };
  }
}

function createLLMProvider(): LLMProvider {
  if ((process.env.LLM_PROVIDER || '').toLowerCase() === 'groq') return new GroqLLMProvider();
  return new DisabledLLMProvider();
}

export class LuminaDataContextService {
  async build(teacherId: string): Promise<TeacherContext> {
    const today = todayDate();
    const inThirtyDays = addDays(today, 30);
    const currentMonth = monthReference();

    const [studentsResult, classesResult, paymentsResult, reportsResult] = await Promise.all([
      supabaseAdmin.from('students').select('id, user_id, full_name, email, subject, status, guardian_whatsapp, price_per_class').eq('teacher_id', teacherId).order('full_name').limit(80),
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
    if (!name) return { error: botMessage(['Preciso saber qual aluno voce quer consultar ou alterar.', '', 'Envie o nome do aluno para eu continuar.']) };
    const normalized = normalize(name);
    const matches = context.students.filter((student) => normalize(student.full_name).includes(normalized) || normalized.includes(normalize(student.full_name)));
    if (matches.length === 0) return { error: botMessage(['Nao encontrei esse aluno na sua conta.', '', 'Verifique o nome ou cadastre esse aluno na LuminaAI.']) };
    if (matches.length > 1) return { error: botMessage(['Encontrei mais de um aluno com esse nome.', '', '*Opcoes encontradas:*', ...matches.map((item) => `- ${item.full_name}`), '', 'Envie o nome mais completo para eu continuar.']) };
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

export class BotConversationStateService extends BotConversationState {}

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

export class BotInteractionLogService extends BotInteractionLog {}

export class BotActionExecutor {
  async execute(connection: BotConnection, action: BotPendingAction) {
    if (action.type === 'CREATE_CLASS') {
      const { data, error } = await supabaseAdmin.from('class_schedules').insert({
        teacher_id: connection.teacher_id,
        student_id: action.student_id,
        student_user_id: action.student_user_id,
        subject: action.subject,
        class_date: action.class_date,
        class_time: action.class_time,
        duration_minutes: action.duration_minutes,
        status: 'scheduled',
      }).select('id').single();
      if (error) throw error;
      const googleSync = data?.id ? await safeGoogleSync(() => createOrUpdateGoogleEventForClass(connection.teacher_id, data.id)) : null;
      return botMessage([
        'Aula marcada com sucesso.',
        '',
        '*📚 Aula:*',
        bullet('Aluno', action.student_name),
        bullet('Data', formatDate(action.class_date)),
        bullet('Horario', formatTime(action.class_time)),
        googleSync,
        '',
        'Deseja registrar alguma observacao para essa aula?',
      ]);
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
      return botMessage([
        'Pagamento registrado com sucesso.',
        '',
        '*💰 Pagamento:*',
        bullet('Aluno', action.student_name),
        bullet('Valor', currency(action.amount)),
        bullet('Mes de referencia', action.month_reference),
        '',
        'Deseja consultar o resumo financeiro do mes?',
      ]);
    }

    if (action.type === 'UPDATE_CLASS') {
      const { error } = await supabaseAdmin
        .from('class_schedules')
        .update({
          class_date: action.class_date,
          class_time: action.class_time,
          updated_at: new Date().toISOString(),
        })
        .eq('id', action.class_id)
        .eq('teacher_id', connection.teacher_id);
      if (error) throw error;
      const googleSync = await safeGoogleSync(() => createOrUpdateGoogleEventForClass(connection.teacher_id, action.class_id));
      return botMessage([
        'Aula remarcada com sucesso.',
        '',
        '*📚 Novo horario:*',
        bullet('Aluno', action.student_name),
        bullet('Data', formatDate(action.class_date)),
        bullet('Horario', formatTime(action.class_time)),
        googleSync,
        '',
        'Deseja enviar uma mensagem de confirmacao ao responsavel?',
      ]);
    }

    if (action.type === 'CANCEL_CLASS') {
      const { error } = await supabaseAdmin
        .from('class_schedules')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .in('id', action.class_ids)
        .eq('teacher_id', connection.teacher_id);
      if (error) throw error;
      const syncResults = await Promise.all(action.class_ids.map((id) => safeGoogleSync(() => deleteGoogleEventForClass(connection.teacher_id, id))));
      const googleSync = syncResults.find((item) => item?.includes('Google Agenda')) || null;
      return botMessage([
        action.class_ids.length === 1 ? 'Aula cancelada com sucesso.' : 'Aulas canceladas com sucesso.',
        '',
        '*📚 Cancelamento:*',
        bullet('Quantidade', action.class_ids.length),
        action.student_name ? bullet('Aluno', action.student_name) : null,
        action.class_date ? bullet('Data', formatDate(action.class_date)) : null,
        googleSync,
        '',
        'Deseja reagendar alguma dessas aulas?',
      ]);
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
        return botMessage([
          'Nao encontrei uma aula agendada com esses dados.',
          '',
          '*📚 Busca realizada:*',
          bullet('Aluno', action.student_name),
          bullet('Data', formatDate(action.class_date)),
          '',
          'Deseja consultar a agenda desse aluno?',
        ]);
      }
      const { error } = await supabaseAdmin.from('class_schedules').update({ status: 'absence' }).eq('id', data.id).eq('teacher_id', connection.teacher_id);
      if (error) throw error;
      return botMessage([
        'Falta registrada com sucesso.',
        '',
        '*⚠️ Falta:*',
        bullet('Aluno', action.student_name),
        bullet('Data', formatDate(action.class_date)),
        '',
        'Deseja criar uma mensagem para o responsavel?',
      ]);
    }

    if (action.type === 'CREATE_NOTE') {
      const { error } = await supabaseAdmin.from('bot_student_notes').insert({
        teacher_id: connection.teacher_id,
        student_id: action.student_id,
        note: action.note,
        source: 'telegram',
      });
      if (error) throw error;
      return botMessage([
        'Anotacao criada com sucesso.',
        '',
        '*📝 Anotacao:*',
        bullet('Aluno', action.student_name),
        bullet('Origem', 'Telegram'),
        '',
        'Deseja consultar o relatorio desse aluno?',
      ]);
    }

    if (action.type === 'SEND_EMAIL') {
      await sendGmailMessage(connection.teacher_id, {
        to: action.to,
        subject: action.subject,
        body: action.body,
      });
      return botMessage([
        'E-mail enviado com sucesso pelo Gmail.',
        '',
        '*Mensagem:*',
        bullet('Aluno', action.student_name),
        bullet('Para', action.to),
        bullet('Assunto', action.subject),
        '',
        'Deseja registrar uma anotacao sobre esse contato?',
      ]);
    }

    return botMessage([
      'Historico apagado com sucesso.',
      '',
      'Posso ajudar com agenda, pagamentos ou relatorios agora?',
    ]);
  }
}

export class ConversationalAssistantService {
  private interpreter: NaturalLanguageInterpreterService;
  private dataContext = new LuminaDataContextService();
  private state = new BotConversationState();
  private actionExecutor = new BotActionExecutor();
  private interactionLog = new BotInteractionLog();
  private trainingExamples = new TrainingExampleService();
  private llm: LLMProvider;

  constructor(llm: LLMProvider = createLLMProvider()) {
    this.llm = llm;
    this.interpreter = new NaturalLanguageInterpreterService(llm);
  }

  async handleMessage(connection: BotConnection, message: string) {
    if (connection.pending_action) {
      const pendingResponse = await this.handlePendingAction(connection, message);
      if (pendingResponse) return pendingResponse;
    }

    const context = await this.dataContext.build(connection.teacher_id);
    const detected = await this.interpreter.interpret(connection, message, context);
    const response = await this.respond(connection, detected, context, message);
    if (detected.source === 'llm' && detected.intent !== 'CONVERSA_GERAL') {
      await this.trainingExamples.save({
        teacherId: connection.teacher_id,
        phrase: message,
        interpretation: detected,
        status: 'pending_review',
        source: 'llm',
      });
    }
    await this.interactionLog.record({
      teacherId: connection.teacher_id,
      telegramUserId: connection.telegram_user_id,
      message,
      response,
      intent: detected.intent,
      metadata: { source: detected.source, confidence: detected.confidence, training_example_id: detected.training_example_id },
    });
    return response;
  }

  private async handlePendingAction(connection: BotConnection, message: string) {
    const action = connection.pending_action;
    if (!action) return '';

    if (action.expires_at && new Date(action.expires_at).getTime() < Date.now()) {
      await this.state.clear(connection);
      return botMessage([
        'Essa confirmacao expirou por seguranca.',
        '',
        'Envie o pedido novamente para eu preparar a acao.',
        '',
        'Quer tentar de novo agora?',
      ]);
    }

    const text = normalize(message);
    if (isCancellation(message)) {
      await this.state.clear(connection);
      return botMessage([
        'Tudo bem, cancelei essa acao.',
        '',
        'Nada foi alterado na LuminaAI.',
        '',
        'Deseja fazer outra coisa?',
      ]);
    }

    if (action.type === 'CREATE_CLASS' && (text.includes('troca') || text.includes('muda') || text.includes('remarca'))) {
      const nextAction = { ...action };
      if (text.includes('amanha') || /\d{1,2}[/-]\d{1,2}/.test(text)) nextAction.class_date = parseDate(message);
      const newTime = parseTime(message);
      if (newTime) nextAction.class_time = newTime;
      nextAction.summary = `marcar aula com ${nextAction.student_name} em ${formatDate(nextAction.class_date)} as ${formatTime(nextAction.class_time)}`;
      nextAction.expires_at = pendingExpiration();
      nextAction.status = 'pending';
      await this.state.set(connection, nextAction);
      return botMessage([
        'Atualizei o pedido pendente.',
        '',
        '*📚 Aula:*',
        bullet('Aluno', nextAction.student_name),
        bullet('Data', formatDate(nextAction.class_date)),
        bullet('Horario', formatTime(nextAction.class_time)),
        '',
        'Confirma que posso marcar essa aula?',
      ]);
    }

    if (!isConfirmation(message)) {
      return botMessage([
        'Tenho uma acao aguardando confirmacao.',
        '',
        '*Pedido:*',
        bullet(action.summary),
        '',
        'Responda "sim" para confirmar ou "cancelar" para desistir.',
      ]);
    }

    if (action.type === 'DELETE_HISTORY') {
      await this.interactionLog.deleteHistory(connection.teacher_id);
      await this.state.clear(connection);
      return botMessage([
        'Historico apagado com sucesso.',
        '',
        'As conversas anteriores do LumiBot foram removidas da sua conta.',
        '',
        'Deseja consultar sua agenda agora?',
      ]);
    }

    const result = await this.actionExecutor.execute(connection, action);
    const originalMessage = typeof action.entities?.originalMessage === 'string' ? action.entities.originalMessage : '';
    if (originalMessage) {
      await this.trainingExamples.save({
        teacherId: connection.teacher_id,
        phrase: originalMessage,
        interpretation: {
          intent: action.intent,
          ...(action.entities || {}),
          confidence: 1,
          source: 'local_rules',
        } as InterpretationResult,
        status: 'auto',
        source: 'confirmed_action',
      });
    }
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

  private async respond(connection: BotConnection, detected: InterpretationResult, context: TeacherContext, originalMessage: string) {
    if (detected.intent === 'PEDIR_AJUDA') return this.help();
    if (detected.source === 'fallback' && detected.natural_response) {
      return botMessage([
        detected.natural_response,
        '',
        '*Exemplo que eu entendo bem:*',
        '- Marque a aula do Joao para amanha as 14h.',
        '- Registre pagamento da Maria de 100 reais.',
        '',
        'Qual acao voce deseja fazer agora?',
      ]);
    }
    if (detected.intent === 'APAGAR_HISTORICO') return this.prepareDeleteHistory(connection);
    if (detected.intent === 'CONSULTAR_AGENDA') return this.agenda(context, detected.date || todayDate());
    if (detected.intent === 'ORGANIZAR_SEMANA') return this.organizeWeek(context);
    if (detected.intent === 'LISTAR_PAGAMENTOS_PENDENTES' || detected.intent === 'LISTAR_PENDENCIAS') return this.pendingPayments(context);
    if (detected.intent === 'LISTAR_ALUNOS') return this.studentsList(context);
    if (detected.intent === 'CONSULTAR_FINANCEIRO') return this.financeSummary(context);
    if (detected.intent === 'GERAR_RELATORIO_FINANCEIRO') return this.financeReport(connection, context, detected.period || 'mes atual', detected.artifactType, detected.artifactDelivery);
    if (detected.intent === 'GERAR_RELATORIO_ALUNOS') return this.studentsReport(connection, context, detected.period || 'mes atual', detected.artifactType, detected.artifactDelivery);
    if (detected.intent === 'RESUMIR_DADOS') return this.attentionSummary(context);
    if (detected.intent === 'CONSULTAR_ALUNO') return this.studentSummary(context, detected.studentName);
    if (detected.intent === 'GERAR_RELATORIO_ALUNO') return this.studentReport(connection, context, detected.studentName, detected.artifactType, detected.artifactDelivery);
    if (detected.intent === 'GERAR_TEXTO_PARA_PAIS_OU_ALUNO' || detected.intent === 'GERAR_MENSAGEM_PARA_RESPONSAVEL') return this.parentText(context, detected.studentName, detected.topic || originalMessage);
    if (detected.intent === 'ENVIAR_EMAIL') return this.prepareEmail(connection, context, detected, originalMessage);
    if (detected.intent === 'CRIAR_AULA') return this.prepareCreateClass(connection, context, detected, originalMessage);
    if (detected.intent === 'ALTERAR_AULA') return this.prepareUpdateClass(connection, context, detected, originalMessage);
    if (detected.intent === 'CANCELAR_AULA') return this.prepareCancelClass(connection, context, detected, originalMessage);
    if (detected.intent === 'REGISTRAR_PAGAMENTO') return this.preparePayment(connection, context, detected, originalMessage);
    if (detected.intent === 'REGISTRAR_FALTA') return this.prepareAbsence(connection, context, detected, originalMessage);
    if (detected.intent === 'CRIAR_ANOTACAO_AULA') return this.prepareNote(connection, context, detected, originalMessage);
    if (detected.source === 'llm' && detected.natural_response) {
      return botMessage([
        detected.natural_response,
        '',
        'Deseja que eu consulte agenda, alunos ou financeiro?',
      ]);
    }

    const llmAnswer = await this.llm.complete({
      systemPrompt: 'Voce e o LumiBot, assistente inteligente da LuminaAI. Sua funcao e ajudar professores particulares a organizar alunos, aulas, agenda, pagamentos, relatorios e rotina. Responda de forma clara, profissional, natural e objetiva. Separe informacoes por topicos, use quebras de linha e termine com uma proxima acao util. Use apenas os dados fornecidos pelo sistema. Nao invente informacoes. Quando o professor pedir uma acao sensivel, solicite confirmacao antes de executar.',
      userMessage: originalMessage,
      context: contextSummary(context),
    });
    if (llmAnswer) return llmAnswer;

    return botMessage([
      'Entendi sua mensagem.',
      '',
      '*Posso ajudar com:*',
      '- Agenda e aulas',
      '- Alunos e relatorios',
      '- Pagamentos',
      '- Mensagens para responsaveis',
      '- Organizacao da semana',
      '',
      'Qual dessas opcoes voce deseja resolver agora?',
    ]);
  }

  private help() {
    return botMessage([
      'Sou o LumiBot, seu assistente da LuminaAI.',
      '',
      '*Posso ajudar com:*',
      '- Agenda',
      '- Alunos',
      '- Pagamentos',
      '- Relatorios',
      '- Planilhas, graficos e documentos',
      '- Mensagens para responsaveis',
      '',
      '*Exemplos:*',
      '- Como esta minha agenda de hoje?',
      '- Tenho algum aluno com pagamento atrasado?',
      '- Me ajude a organizar minha semana.',
      '- Marque aula com Ana amanha as 15h.',
      '- O Pedro faltou hoje, registra pra mim.',
      '- Como foi a evolucao da Maria nas ultimas aulas?',
      '- Me mande uma planilha com o relatorio financeiro mensal.',
      '- Crie um grafico dos meus recebimentos.',
      '- Crie uma foto com o grafico dos meus recebimentos.',
      '',
      'Quando uma acao alterar dados, eu sempre vou pedir confirmacao antes.',
      '',
      'O que voce deseja fazer agora?',
    ]);
  }

  private agenda(context: TeacherContext, date: string) {
    const classes = context.classes.filter((item) => item.class_date === date).sort((a, b) => a.class_time.localeCompare(b.class_time));
    if (!classes.length) {
      return botMessage([
        `Nao encontrei aulas agendadas para ${formatDate(date)}.`,
        '',
        'Deseja marcar uma nova aula para esse dia?',
      ]);
    }
    const pendingStudents = new Set(this.pendingPaymentRows(context).map((item) => item.student_id));
    const pending = classes.filter((item) => pendingStudents.has(item.student_id));
    return botMessage([
      `Encontrei sua agenda de ${formatDate(date)}.`,
      '',
      '*📚 Aulas marcadas:*',
      ...classes.map((item) => `- ${item.students?.full_name || 'Aluno'} - ${formatTime(item.class_time)} - ${item.subject || 'Aula'} - ${shortStatus(item.status)}`),
      pending.length ? '' : null,
      pending.length ? '*⚠️ Pendencias:*' : null,
      ...pending.map((item) => `- ${item.students?.full_name || 'Aluno'} tem pagamento pendente.`),
      '',
      'Posso registrar uma anotacao, pagamento ou falta para voce?',
    ]);
  }

  private organizeWeek(context: TeacherContext) {
    const today = todayDate();
    const weekEnd = addDays(today, 7);
    const weekClasses = context.classes.filter((item) => item.class_date >= today && item.class_date <= weekEnd && item.status === 'scheduled');
    const pending = this.pendingPaymentRows(context);
    const attention = this.attentionRows(context).slice(0, 3);
    return botMessage([
      'Organizei um resumo da sua semana.',
      '',
      '*📚 Aulas:*',
      bullet('Proximos sete dias', weekClasses.length),
      weekClasses.length ? bullet('Dias mais cheios', this.busyDays(weekClasses)) : '- Ainda nao ha aulas agendadas na semana.',
      '',
      '*💰 Pagamentos:*',
      pending.length ? `- ${pending.length} pagamento${pending.length === 1 ? '' : 's'} para acompanhar.` : '- Nao encontrei pagamentos pendentes neste mes.',
      ...pending.slice(0, 5).map((item) => `- ${item.students?.full_name || 'Aluno'} - ${currency(Number(item.amount || 0) - Number(item.paid_amount || 0))}`),
      '',
      '*Atencao:*',
      attention.length ? `- ${attention.length} aluno${attention.length === 1 ? '' : 's'} precisa${attention.length === 1 ? '' : 'm'} de acompanhamento.` : '- Nao encontrei alertas fortes nos relatorios recentes.',
      ...attention.map((item) => `- ${item.name} - media ${Math.round(item.average)}.`),
      '',
      'Deseja que eu prepare uma lista de prioridades para hoje?',
    ]);
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
    if (!pending.length) {
      return botMessage([
        `Nao encontrei pagamentos pendentes em ${monthReference()}.`,
        '',
        'Deseja consultar o resumo financeiro completo?',
      ]);
    }
    return botMessage([
      `Encontrei pagamentos pendentes em ${monthReference()}.`,
      '',
      '*A receber:*',
      ...pending.map((item) => `- ${item.students?.full_name || 'Aluno'} - ${currency(Number(item.amount || 0) - Number(item.paid_amount || 0))} - ${shortStatus(item.status)}`),
      '',
      'Deseja que eu crie uma mensagem de cobranca educada?',
    ]);
  }

  private financeSummary(context: TeacherContext) {
    const paid = context.payments.filter((item) => item.status === 'paid').reduce((sum, item) => sum + Number(item.paid_amount || item.amount || 0), 0);
    const pending = this.pendingPaymentRows(context).reduce((sum, item) => sum + Number(item.amount || 0) - Number(item.paid_amount || 0), 0);
    return botMessage([
      `Preparei seu resumo financeiro de ${monthReference()}.`,
      '',
      '*Recebido:*',
      bullet('Total', currency(paid)),
      '',
      '*A receber:*',
      bullet('Total pendente', currency(pending)),
      '',
      '*Alunos:*',
      bullet('Alunos ativos', context.students.filter((item) => item.status === 'active').length),
      '',
      'Deseja gerar esse resumo em grafico, planilha ou relatorio?',
    ]);
  }

  private async financeReport(connection: BotConnection, context: TeacherContext, period: string, artifactType?: DetectedIntent['artifactType'], artifactDelivery?: DetectedIntent['artifactDelivery']) {
    const paidRows = context.payments.filter((item) => item.status === 'paid');
    const pendingRows = this.pendingPaymentRows(context);
    const paid = paidRows.reduce((sum, item) => sum + Number(item.paid_amount || item.amount || 0), 0);
    const pending = pendingRows.reduce((sum, item) => sum + Number(item.amount || 0) - Number(item.paid_amount || 0), 0);
    if (artifactType) {
      const file = this.financeArtifact(period, artifactType, paidRows, pendingRows, paid, pending, artifactDelivery);
      const sent = file.sendAs === 'photo' ? await telegramSendPhoto(connection, file as any) : await telegramSendDocument(connection, file);
      return botMessage([
        sent ? `Preparei e enviei o ${artifactLabel(artifactType)} do relatorio financeiro.` : `Preparei o ${artifactLabel(artifactType)}, mas nao consegui enviar o arquivo pelo Telegram agora.`,
        '',
        '*Arquivo:*',
        bullet('Tipo', artifactLabel(artifactType)),
        bullet('Formato', artifactFormat(artifactType, artifactDelivery)),
        bullet('Periodo', period),
        '',
        sent ? 'Deseja que eu gere outro formato tambem?' : 'Tente novamente em alguns minutos ou peca outro formato.',
      ]);
    }
    return botMessage([
      'Preparei seu relatorio financeiro.',
      '',
      '*Periodo:*',
      bullet('Referencia', period),
      '',
      '*Recebido:*',
      bullet('Total recebido', currency(paid)),
      bullet('Pagamentos registrados', context.payments.length),
      '',
      '*A receber:*',
      bullet('Total pendente', currency(pending)),
      pendingRows.length ? '*Alunos com pendencia:*' : null,
      ...pendingRows.slice(0, 8).map((item) => `- ${item.students?.full_name || 'Aluno'} - ${currency(Number(item.amount || 0) - Number(item.paid_amount || 0))}`),
      '',
      '*Resumo:*',
      pending > 0
        ? 'Ainda existem valores pendentes que merecem acompanhamento.'
        : 'Os pagamentos do periodo parecem organizados com base nos registros atuais.',
      '',
      'Posso gerar esse relatorio em grafico ou planilha?',
    ]);
  }

  private financeArtifact(
    period: string,
    artifactType: DetectedIntent['artifactType'],
    paidRows: PaymentLite[],
    pendingRows: PaymentLite[],
    paid: number,
    pending: number,
    artifactDelivery?: DetectedIntent['artifactDelivery']
  ) {
    const baseName = `relatorio-financeiro-${safeFilename(period)}-${monthReference()}`;
    if (artifactType === 'spreadsheet') {
      return {
        filename: `${baseName}.xls`,
        content: spreadsheetXmlContent([
          {
            name: 'Financeiro',
            title: 'Relatorio financeiro mensal',
            summary: [
              ['Periodo', period],
              ['Total recebido', paid],
              ['Total pendente', pending],
              ['Pagamentos registrados', paidRows.length + pendingRows.length],
            ],
            headers: ['Categoria', 'Aluno', 'Mes', 'Status', 'Valor total', 'Valor pago', 'Valor pendente', 'Vencimento'],
            rows: [
              ...paidRows.map((item) => ['Recebido', item.students?.full_name || 'Aluno', item.month_reference, shortStatus(item.status), Number(item.amount || 0), Number(item.paid_amount || item.amount || 0), 0, item.due_date || '']),
              ...pendingRows.map((item) => ['A receber', item.students?.full_name || 'Aluno', item.month_reference, shortStatus(item.status), Number(item.amount || 0), Number(item.paid_amount || 0), Number(item.amount || 0) - Number(item.paid_amount || 0), item.due_date || '']),
            ],
          },
        ]),
        contentType: 'application/vnd.ms-excel;charset=utf-8',
        caption: 'Planilha estruturada do relatorio financeiro gerada pela LuminaAI.',
        sendAs: 'document' as const,
      };
    }
    if (artifactType === 'chart') {
      const rows = [
        { label: 'Recebido', value: paid, color: '#60a5fa' },
        { label: 'A receber', value: pending, color: '#f59e0b' },
      ];
      if (artifactDelivery === 'photo') {
        return {
          filename: `${baseName}.png`,
          content: simpleBarChartPng({ rows }),
          contentType: 'image/png',
          caption: `Grafico financeiro gerado pela LuminaAI.\nRecebido: ${currency(paid)}\nA receber: ${currency(pending)}\nPeriodo: ${period}`,
          sendAs: 'photo' as const,
        };
      }
      return {
        filename: `${baseName}.svg`,
        content: simpleBarChartSvg({
          title: 'Relatorio financeiro',
          rows,
        }),
        contentType: 'image/svg+xml;charset=utf-8',
        caption: 'Grafico financeiro gerado pela LuminaAI.',
        sendAs: 'document' as const,
      };
    }
    return {
      filename: `${baseName}.txt`,
      content: [
        'Relatorio financeiro - LuminaAI',
        '',
        `Periodo: ${period}`,
        `Total recebido: ${currency(paid)}`,
        `Total pendente: ${currency(pending)}`,
        '',
        'Pagamentos recebidos:',
        ...(paidRows.length ? paidRows.map((item) => `- ${item.students?.full_name || 'Aluno'} - ${currency(Number(item.paid_amount || item.amount || 0))} - ${item.month_reference}`) : ['- Nenhum pagamento recebido no periodo.']),
        '',
        'Valores pendentes:',
        ...(pendingRows.length ? pendingRows.map((item) => `- ${item.students?.full_name || 'Aluno'} - ${currency(Number(item.amount || 0) - Number(item.paid_amount || 0))} - ${item.month_reference}`) : ['- Nenhum valor pendente encontrado.']),
      ].join('\n'),
      contentType: 'text/plain;charset=utf-8',
      caption: 'Documento financeiro gerado pela LuminaAI.',
      sendAs: 'document' as const,
    };
  }

  private studentsList(context: TeacherContext) {
    if (!context.students.length) {
      return botMessage([
        'Voce ainda nao tem alunos cadastrados.',
        '',
        'Deseja cadastrar seu primeiro aluno?',
      ]);
    }
    return botMessage([
      'Encontrei seus alunos cadastrados.',
      '',
      '*Alunos:*',
      ...context.students.slice(0, 20).map((student) => `- ${student.full_name} - ${student.subject || 'sem materia'} - ${shortStatus(student.status)}`),
      '',
      'Deseja consultar o relatorio de algum aluno?',
    ]);
  }

  private async studentsReport(connection: BotConnection, context: TeacherContext, period: string, artifactType?: DetectedIntent['artifactType'], artifactDelivery?: DetectedIntent['artifactDelivery']) {
    const active = context.students.filter((item) => item.status === 'active');
    const today = todayDate();
    const recentLimit = addDays(today, -30);
    const studentsWithRecentClass = new Set(context.classes.filter((item) => item.class_date >= recentLimit).map((item) => item.student_id));
    const studentsWithAbsence = new Set(context.classes.filter((item) => item.status === 'absence').map((item) => item.student_id));
    const pending = new Set(this.pendingPaymentRows(context).map((item) => item.student_id));
    const withoutRecent = active.filter((student) => !studentsWithRecentClass.has(student.id));
    if (artifactType) {
      const file = this.studentsArtifact(period, artifactType, context, active, studentsWithRecentClass, studentsWithAbsence, pending, withoutRecent, artifactDelivery);
      const sent = file.sendAs === 'photo' ? await telegramSendPhoto(connection, file as any) : await telegramSendDocument(connection, file);
      return botMessage([
        sent ? `Preparei e enviei o ${artifactLabel(artifactType)} do relatorio dos alunos.` : `Preparei o ${artifactLabel(artifactType)}, mas nao consegui enviar o arquivo pelo Telegram agora.`,
        '',
        '*Arquivo:*',
        bullet('Tipo', artifactLabel(artifactType)),
        bullet('Formato', artifactFormat(artifactType, artifactDelivery)),
        bullet('Periodo', period),
        '',
        sent ? 'Deseja que eu gere um relatorio individual de algum aluno?' : 'Tente novamente em alguns minutos ou peca outro formato.',
      ]);
    }
    return botMessage([
      'Preparei o relatorio geral dos alunos.',
      '',
      '*Periodo:*',
      bullet('Referencia', period),
      '',
      '*Alunos:*',
      bullet('Ativos', active.length),
      bullet('Com aulas recentes', active.filter((student) => studentsWithRecentClass.has(student.id)).length),
      '',
      '*Pontos de atencao:*',
      withoutRecent.length ? `- Sem aula recente: ${withoutRecent.map((student) => student.full_name).join(', ')}` : '- Nenhum aluno sem aula recente.',
      pending.size ? `- Pendencias financeiras: ${active.filter((student) => pending.has(student.id)).map((student) => student.full_name).join(', ')}` : '- Nenhuma pendencia financeira encontrada.',
      studentsWithAbsence.size ? `- Faltas registradas: ${active.filter((student) => studentsWithAbsence.has(student.id)).map((student) => student.full_name).join(', ')}` : '- Nenhuma falta registrada nos dados recentes.',
      '',
      'Deseja ver o relatorio detalhado de algum aluno?',
    ]);
  }

  private studentsArtifact(
    period: string,
    artifactType: DetectedIntent['artifactType'],
    context: TeacherContext,
    active: StudentLite[],
    studentsWithRecentClass: Set<string>,
    studentsWithAbsence: Set<string>,
    pending: Set<string>,
    withoutRecent: StudentLite[],
    artifactDelivery?: DetectedIntent['artifactDelivery']
  ) {
    const baseName = `relatorio-alunos-${safeFilename(period)}-${monthReference()}`;
    if (artifactType === 'spreadsheet') {
      return {
        filename: `${baseName}.xls`,
        content: spreadsheetXmlContent([
          {
            name: 'Alunos',
            title: 'Relatorio geral dos alunos',
            summary: [
              ['Periodo', period],
              ['Alunos ativos', active.length],
              ['Com aula recente', active.filter((student) => studentsWithRecentClass.has(student.id)).length],
              ['Com pendencia financeira', active.filter((student) => pending.has(student.id)).length],
            ],
            headers: ['Aluno', 'Materia', 'Status', 'Aula recente', 'Possui falta registrada', 'Pagamento pendente'],
            rows: context.students.map((student) => [
              student.full_name,
              student.subject || '',
              shortStatus(student.status),
              studentsWithRecentClass.has(student.id) ? 'Sim' : 'Nao',
              studentsWithAbsence.has(student.id) ? 'Sim' : 'Nao',
              pending.has(student.id) ? 'Sim' : 'Nao',
            ]),
          },
        ]),
        contentType: 'application/vnd.ms-excel;charset=utf-8',
        caption: 'Planilha estruturada de alunos gerada pela LuminaAI.',
        sendAs: 'document' as const,
      };
    }
    if (artifactType === 'chart') {
      const rows = [
        { label: 'Alunos ativos', value: active.length, color: '#2563eb' },
        { label: 'Com aula recente', value: active.filter((student) => studentsWithRecentClass.has(student.id)).length, color: '#10b981' },
        { label: 'Sem aula recente', value: withoutRecent.length, color: '#f59e0b' },
        { label: 'Com pendencia', value: active.filter((student) => pending.has(student.id)).length, color: '#ef4444' },
      ];
      if (artifactDelivery === 'photo') {
        return {
          filename: `${baseName}.png`,
          content: simpleBarChartPng({ rows }),
          contentType: 'image/png',
          caption: `Grafico de alunos gerado pela LuminaAI.\nAtivos: ${active.length}\nCom aula recente: ${active.filter((student) => studentsWithRecentClass.has(student.id)).length}\nCom pendencia: ${active.filter((student) => pending.has(student.id)).length}`,
          sendAs: 'photo' as const,
        };
      }
      return {
        filename: `${baseName}.svg`,
        content: simpleBarChartSvg({
          title: 'Resumo dos alunos',
          rows,
        }),
        contentType: 'image/svg+xml;charset=utf-8',
        caption: 'Grafico de alunos gerado pela LuminaAI.',
        sendAs: 'document' as const,
      };
    }
    return {
      filename: `${baseName}.txt`,
      content: [
        'Relatorio geral dos alunos - LuminaAI',
        '',
        `Periodo: ${period}`,
        `Alunos ativos: ${active.length}`,
        `Com aulas recentes: ${active.filter((student) => studentsWithRecentClass.has(student.id)).length}`,
        '',
        'Pontos de atencao:',
        withoutRecent.length ? `- Sem aula recente: ${withoutRecent.map((student) => student.full_name).join(', ')}` : '- Nenhum aluno sem aula recente.',
        pending.size ? `- Pendencias financeiras: ${active.filter((student) => pending.has(student.id)).map((student) => student.full_name).join(', ')}` : '- Nenhuma pendencia financeira encontrada.',
        studentsWithAbsence.size ? `- Faltas registradas: ${active.filter((student) => studentsWithAbsence.has(student.id)).map((student) => student.full_name).join(', ')}` : '- Nenhuma falta registrada nos dados recentes.',
      ].join('\n'),
      contentType: 'text/plain;charset=utf-8',
      caption: 'Documento de alunos gerado pela LuminaAI.',
      sendAs: 'document' as const,
    };
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
    if (!rows.length) {
      return botMessage([
        'Nao encontrei alunos com sinais claros de dificuldade nos relatorios recentes.',
        '',
        'Essa analise depende dos relatorios de aula estarem preenchidos.',
        '',
        'Deseja registrar um relatorio de aula agora?',
      ]);
    }
    return botMessage([
      'Encontrei alunos que podem precisar de mais atencao.',
      '',
      '*Alunos em observacao:*',
      ...rows.slice(0, 5).map((item) => `- ${item.name} - media ${Math.round(item.average)} - ${item.issues.slice(0, 2).join('; ') || 'sem detalhe registrado'}`),
      '',
      'Deseja preparar um plano de reforco para algum deles?',
    ]);
  }

  private studentSummary(context: TeacherContext, studentName?: string) {
    const { student, error } = this.dataContext.findStudent(context, studentName);
    if (!student) return error || 'Nao encontrei esse aluno.';
    const nextClasses = context.classes.filter((item) => item.student_id === student.id && item.status === 'scheduled').slice(0, 3);
    const reports = context.reports.filter((item) => item.student_id === student.id).slice(0, 3);
    return botMessage([
      `Encontrei o aluno ${student.full_name}.`,
      '',
      '*Cadastro:*',
      bullet('Materia', student.subject || 'sem materia cadastrada'),
      bullet('Status', shortStatus(student.status)),
      '',
      '*Proximas aulas:*',
      nextClasses.length ? null : '- Nao encontrei proximas aulas agendadas.',
      ...nextClasses.map((item) => `- ${formatDate(item.class_date)} - ${formatTime(item.class_time)}`),
      '',
      '*Relatorios recentes:*',
      reports.length ? null : '- Ainda nao ha relatorios recentes cadastrados.',
      ...reports.map((item) => `- ${item.summary || item.learning_progress || item.detected_doubts || 'sem resumo'}`),
      '',
      'Deseja marcar aula, registrar pagamento ou gerar relatorio desse aluno?',
    ]);
  }

  private async studentReport(connection: BotConnection, context: TeacherContext, studentName?: string, artifactType?: DetectedIntent['artifactType'], artifactDelivery?: DetectedIntent['artifactDelivery']) {
    const { student, error } = this.dataContext.findStudent(context, studentName);
    if (!student) return error || 'Nao encontrei esse aluno.';
    const reports = context.reports.filter((item) => item.student_id === student.id).slice(0, 5);
    if (!reports.length) {
      return botMessage([
        `Ainda nao ha relatorios suficientes para avaliar a evolucao de ${student.full_name}.`,
        '',
        'Registre relatorios de aula para que eu consiga analisar o progresso com mais precisao.',
        '',
        'Deseja criar uma anotacao para esse aluno?',
      ]);
    }
    const scores = reports.map((item) => item.learning_score).filter((score): score is number => typeof score === 'number');
    const avg = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
    if (artifactType) {
      const file = this.studentArtifact(student, reports, artifactType, avg, artifactDelivery);
      const sent = file.sendAs === 'photo' ? await telegramSendPhoto(connection, file as any) : await telegramSendDocument(connection, file);
      return botMessage([
        sent ? `Preparei e enviei o ${artifactLabel(artifactType)} da evolucao de ${student.full_name}.` : `Preparei o ${artifactLabel(artifactType)}, mas nao consegui enviar o arquivo pelo Telegram agora.`,
        '',
        '*Arquivo:*',
        bullet('Tipo', artifactLabel(artifactType)),
        bullet('Formato', artifactFormat(artifactType, artifactDelivery)),
        bullet('Aluno', student.full_name),
        '',
        sent ? 'Deseja transformar essa analise em mensagem para o responsavel?' : 'Tente novamente em alguns minutos ou peca outro formato.',
      ]);
    }
    return botMessage([
      `Preparei a evolucao de ${student.full_name}.`,
      '',
      '*Desempenho:*',
      avg != null ? bullet('Media recente', `${avg} de 100`) : '- Sem pontuacao numerica suficiente.',
      '',
      '*Avancos:*',
      ...((reports.map((item) => item.learning_progress || item.learning_evidence || item.summary).filter(Boolean).slice(0, 3) as string[]).map((item) => `- ${item}`)),
      reports.map((item) => item.learning_progress || item.learning_evidence || item.summary).filter(Boolean).length ? null : '- Sem observacoes registradas.',
      '',
      '*Pontos de reforco:*',
      ...((reports.map((item) => item.detected_doubts || item.reinforcement_points).filter(Boolean).slice(0, 3) as string[]).map((item) => `- ${item}`)),
      reports.map((item) => item.detected_doubts || item.reinforcement_points).filter(Boolean).length ? null : '- Sem dificuldades recorrentes registradas.',
      '',
      'Deseja transformar essa analise em uma mensagem para o responsavel?',
    ]);
  }

  private studentArtifact(student: StudentLite, reports: LessonReportLite[], artifactType: DetectedIntent['artifactType'], average: number | null, artifactDelivery?: DetectedIntent['artifactDelivery']) {
    const baseName = `evolucao-${safeFilename(student.full_name)}-${monthReference()}`;
    if (artifactType === 'spreadsheet') {
      return {
        filename: `${baseName}.xls`,
        content: spreadsheetXmlContent([
          {
            name: 'Evolucao',
            title: `Evolucao de ${student.full_name}`,
            summary: [
              ['Aluno', student.full_name],
              ['Materia', student.subject || 'sem materia cadastrada'],
              ['Media recente', average ?? 'sem pontuacao suficiente'],
              ['Relatorios analisados', reports.length],
            ],
            headers: ['Data', 'Materia', 'Pontuacao', 'Resumo', 'Conteudo', 'Duvidas detectadas', 'Pontos de reforco', 'Proxima recomendacao'],
            rows: reports.map((report) => [
              report.created_at.slice(0, 10),
              report.class_schedules?.subject || report.students?.subject || student.subject || '',
              typeof report.learning_score === 'number' ? report.learning_score : '',
              report.summary || '',
              report.taught_content || '',
              report.detected_doubts || report.student_questions || '',
              report.reinforcement_points || '',
              report.next_recommendation || '',
            ]),
          },
        ]),
        contentType: 'application/vnd.ms-excel;charset=utf-8',
        caption: 'Planilha estruturada de evolucao gerada pela LuminaAI.',
        sendAs: 'document' as const,
      };
    }
    if (artifactType === 'chart') {
      const scored = reports
        .filter((report) => typeof report.learning_score === 'number')
        .map((report, index) => ({ label: `Aula ${reports.length - index}`, value: Number(report.learning_score || 0), color: '#8b5cf6' }))
        .reverse();
      if (artifactDelivery === 'photo') {
        return {
          filename: `${baseName}.png`,
          content: simpleBarChartPng({ rows: scored.length ? scored : [{ label: 'Sem pontuacao', value: 0, color: '#94a3b8' }] }),
          contentType: 'image/png',
          caption: `Grafico de evolucao gerado pela LuminaAI.\nAluno: ${student.full_name}\nMedia recente: ${average != null ? `${average} de 100` : 'sem pontuacao suficiente'}\nRelatorios analisados: ${reports.length}`,
          sendAs: 'photo' as const,
        };
      }
      return {
        filename: `${baseName}.svg`,
        content: simpleBarChartSvg({
          title: `Evolucao de ${student.full_name}`,
          rows: scored.length ? scored : [{ label: 'Sem pontuacao', value: 0, color: '#94a3b8' }],
        }),
        contentType: 'image/svg+xml;charset=utf-8',
        caption: 'Grafico de evolucao gerado pela LuminaAI.',
        sendAs: 'document' as const,
      };
    }
    return {
      filename: `${baseName}.txt`,
      content: [
        `Evolucao de ${student.full_name} - LuminaAI`,
        '',
        `Materia: ${student.subject || 'sem materia cadastrada'}`,
        average != null ? `Media recente: ${average} de 100` : 'Media recente: sem pontuacao suficiente',
        '',
        'Avancos:',
        ...((reports.map((item) => item.learning_progress || item.learning_evidence || item.summary).filter(Boolean).slice(0, 5) as string[]).map((item) => `- ${item}`)),
        '',
        'Pontos de reforco:',
        ...((reports.map((item) => item.detected_doubts || item.reinforcement_points).filter(Boolean).slice(0, 5) as string[]).map((item) => `- ${item}`)),
      ].join('\n'),
      contentType: 'text/plain;charset=utf-8',
      caption: 'Documento de evolucao gerado pela LuminaAI.',
      sendAs: 'document' as const,
    };
  }

  private async prepareEmail(connection: BotConnection, context: TeacherContext, detected: DetectedIntent, originalMessage: string) {
    if (!detected.studentName) {
      return botMessage([
        'Entendi que voce quer enviar um e-mail.',
        '',
        '*Falta informar:*',
        '- Nome do aluno',
        '',
        'Exemplo: "mande um e-mail para Ana confirmando a aula de amanha".',
      ]);
    }

    const { student, error } = this.dataContext.findStudent(context, detected.studentName);
    if (!student) return error || 'Nao encontrei esse aluno.';
    if (!student.email) {
      return botMessage([
        `Nao encontrei e-mail cadastrado para ${student.full_name}.`,
        '',
        'Cadastre o e-mail do aluno antes de enviar mensagens pelo Gmail.',
      ]);
    }

    const subject = this.emailSubject(originalMessage, student);
    const body = this.emailBody(originalMessage, student);
    const action: BotPendingAction = {
      type: 'SEND_EMAIL',
      intent: 'ENVIAR_EMAIL',
      teacher_id: connection.teacher_id,
      telegram_user_id: connection.telegram_user_id,
      entities: { ...(detected as Record<string, unknown>), originalMessage },
      student_id: student.id,
      student_name: student.full_name,
      to: student.email,
      subject,
      body,
      summary: `enviar e-mail para ${student.full_name} em ${student.email}`,
      expires_at: pendingExpiration(),
      status: 'pending',
    };
    await this.state.set(connection, action);

    return botMessage([
      'Preparei o e-mail para envio.',
      '',
      '*E-mail:*',
      bullet('Aluno', student.full_name),
      bullet('Para', student.email),
      bullet('Assunto', subject),
      '',
      '*Mensagem:*',
      body,
      '',
      'Confirma que posso enviar esse e-mail pelo Gmail?',
    ]);
  }

  private emailSubject(message: string, student: StudentLite) {
    const text = normalize(message);
    if (text.includes('falta') || text.includes('faltou') || text.includes('nao compareceu')) return `Ausencia na aula - ${student.full_name}`;
    if (text.includes('pagamento') || text.includes('cobr')) return `Pagamento pendente - ${student.full_name}`;
    if (text.includes('confirm')) return `Confirmacao de aula - ${student.full_name}`;
    if (text.includes('reagend') || text.includes('remarc')) return `Remarcacao de aula - ${student.full_name}`;
    return `Atualizacao de aula - ${student.full_name}`;
  }

  private emailBody(message: string, student: StudentLite) {
    const text = normalize(message);
    if (text.includes('falta') || text.includes('faltou') || text.includes('nao compareceu')) {
      return `Ola!\n\nPassando para avisar que ${student.full_name} nao compareceu a aula. Caso seja necessario, podemos combinar um novo horario para repor o conteudo.\n\nAtenciosamente.`;
    }
    if (text.includes('pagamento') || text.includes('cobr')) {
      return `Ola!\n\nPassando para lembrar sobre o pagamento pendente relacionado as aulas de ${student.full_name}. Se ja tiver sido realizado, por favor desconsidere esta mensagem.\n\nAtenciosamente.`;
    }
    if (text.includes('confirm')) {
      return `Ola!\n\nPassando para confirmar a proxima aula de ${student.full_name}. Qualquer necessidade de ajuste no horario, fico a disposicao.\n\nAtenciosamente.`;
    }
    if (text.includes('reagend') || text.includes('remarc')) {
      return `Ola!\n\nPassando para alinhar a remarcacao da aula de ${student.full_name}. Podemos confirmar o melhor horario para manter a continuidade dos estudos.\n\nAtenciosamente.`;
    }
    return `Ola!\n\nEstou entrando em contato para compartilhar uma atualizacao sobre as aulas de ${student.full_name}. Podemos alinhar os proximos passos para manter uma boa evolucao nos estudos.\n\nAtenciosamente.`;
  }

  private parentText(context: TeacherContext, studentName: string | undefined, topic: string) {
    const { student } = this.dataContext.findStudent(context, studentName);
    const name = student?.full_name || 'seu filho(a)';
    const text = normalize(topic);
    if (text.includes('faltou')) {
      return botMessage([
        'Preparei uma sugestao de mensagem.',
        '',
        '*Mensagem:*',
        `Ola! Passando para avisar que ${name} nao compareceu a aula de hoje. Caso queira, podemos combinar um novo horario para repor o conteudo.`,
        '',
        'Deseja que eu deixe essa mensagem mais formal ou mais curta?',
      ]);
    }
    return botMessage([
      'Preparei uma sugestao de mensagem.',
      '',
      '*Mensagem:*',
      `Ola! Tudo bem? Estou entrando em contato para compartilhar uma atualizacao sobre ${name}. Podemos alinhar os proximos passos para manter uma boa evolucao nos estudos.`,
      '',
      'Deseja que eu adapte o texto para WhatsApp?',
    ]);
  }

  private async prepareCreateClass(connection: BotConnection, context: TeacherContext, detected: DetectedIntent, originalMessage: string) {
    if (!detected.studentName || !detected.date || !detected.time) {
      return botMessage([
        'Entendi que voce quer marcar uma aula.',
        '',
        '*Falta informar:*',
        !detected.studentName ? '- Nome do aluno' : null,
        !detected.date ? '- Data da aula' : null,
        !detected.time ? '- Horario da aula' : null,
        '',
        'Exemplo: "marque a aula do Joao para amanha as 14h".',
      ]);
    }
    const { student, error } = this.dataContext.findStudent(context, detected.studentName);
    if (!student) return error || 'Nao encontrei esse aluno.';
    const action: BotPendingAction = {
      type: 'CREATE_CLASS',
      intent: 'CRIAR_AULA',
      teacher_id: connection.teacher_id,
      telegram_user_id: connection.telegram_user_id,
      entities: { ...(detected as Record<string, unknown>), originalMessage },
      student_id: student.id,
      student_name: student.full_name,
      student_user_id: student.user_id,
      subject: student.subject,
      class_date: detected.date,
      class_time: detected.time,
      duration_minutes: 60,
      summary: `marcar aula com ${student.full_name} em ${formatDate(detected.date)} as ${formatTime(detected.time)}`,
      expires_at: pendingExpiration(),
      status: 'pending',
    };
    await this.state.set(connection, action);
    return botMessage([
      'Entendi o pedido.',
      '',
      '*Aula:*',
      bullet('Aluno', student.full_name),
      bullet('Data', formatDate(detected.date)),
      bullet('Horario', formatTime(detected.time)),
      bullet('Duracao', '60 minutos'),
      '',
      'Confirma que posso marcar essa aula?',
    ]);
  }

  private async prepareUpdateClass(connection: BotConnection, context: TeacherContext, detected: DetectedIntent, originalMessage: string) {
    if (!detected.studentName) {
      return botMessage([
        'Entendi que voce quer remarcar uma aula.',
        '',
        'Me diga qual aluno devo remarcar para eu continuar.',
      ]);
    }
    const { student, error } = this.dataContext.findStudent(context, detected.studentName);
    if (!student) return error || 'Nao encontrei esse aluno.';
    if (!detected.date && !detected.time) {
      return botMessage([
        `Encontrei ${student.full_name}.`,
        '',
        'Para remarcar a aula, me envie a nova data ou o novo horario.',
      ]);
    }
    const currentClass = context.classes.find((item) => item.student_id === student.id && item.status === 'scheduled');
    if (!currentClass) {
      return botMessage([
        `Nao encontrei aula agendada para ${student.full_name}.`,
        '',
        'Deseja marcar uma nova aula para esse aluno?',
      ]);
    }
    const nextDate = detected.date || currentClass.class_date;
    const nextTime = detected.time || currentClass.class_time;
    const action: BotPendingAction = {
      type: 'UPDATE_CLASS',
      intent: 'ALTERAR_AULA',
      teacher_id: connection.teacher_id,
      telegram_user_id: connection.telegram_user_id,
      entities: { ...(detected as Record<string, unknown>), originalMessage },
      class_id: currentClass.id,
      student_name: student.full_name,
      class_date: nextDate,
      class_time: nextTime,
      summary: `remarcar aula de ${student.full_name} para ${formatDate(nextDate)} as ${formatTime(nextTime)}`,
      expires_at: pendingExpiration(),
      status: 'pending',
    };
    await this.state.set(connection, action);
    return botMessage([
      'Entendi o pedido de remarcacao.',
      '',
      '*Nova aula:*',
      bullet('Aluno', student.full_name),
      bullet('Data', formatDate(nextDate)),
      bullet('Horario', formatTime(nextTime)),
      '',
      'Confirma que posso remarcar essa aula?',
    ]);
  }

  private async prepareCancelClass(connection: BotConnection, context: TeacherContext, detected: DetectedIntent, originalMessage: string) {
    const date = detected.date;
    let classes = context.classes.filter((item) => item.status === 'scheduled');
    let studentName = detected.studentName;
    if (studentName) {
      const { student, error } = this.dataContext.findStudent(context, studentName);
      if (!student) return error || 'Nao encontrei esse aluno.';
      studentName = student.full_name;
      classes = classes.filter((item) => item.student_id === student.id);
    }
    if (date) classes = classes.filter((item) => item.class_date === date);
    if (detected.time) classes = classes.filter((item) => item.class_time === detected.time);
    if (!classes.length) {
      return botMessage([
        'Nao encontrei nenhuma aula agendada com esses dados para cancelar.',
        '',
        'Envie o aluno, a data ou o horario para eu buscar novamente.',
      ]);
    }
    if (classes.length > 5) {
      return botMessage([
        'Encontrei muitas aulas para cancelar.',
        '',
        'Para evitar erro, me diga o aluno, a data ou o horario exato.',
      ]);
    }
    const summary = classes.length === 1
      ? `cancelar aula de ${classes[0].students?.full_name || studentName || 'aluno'} em ${formatDate(classes[0].class_date)} as ${formatTime(classes[0].class_time)}`
      : `cancelar ${classes.length} aulas${date ? ` em ${formatDate(date)}` : ''}`;
    const action: BotPendingAction = {
      type: 'CANCEL_CLASS',
      intent: 'CANCELAR_AULA',
      teacher_id: connection.teacher_id,
      telegram_user_id: connection.telegram_user_id,
      entities: { ...(detected as Record<string, unknown>), originalMessage },
      class_ids: classes.map((item) => item.id),
      student_name: studentName,
      class_date: date,
      summary,
      expires_at: pendingExpiration(),
      status: 'pending',
    };
    await this.state.set(connection, action);
    return botMessage([
      'Entendi o pedido de cancelamento.',
      '',
      '*Aula:*',
      classes.length === 1 ? bullet('Aluno', classes[0].students?.full_name || studentName || 'aluno') : bullet('Quantidade', classes.length),
      classes.length === 1 ? bullet('Data', formatDate(classes[0].class_date)) : date ? bullet('Data', formatDate(date)) : null,
      classes.length === 1 ? bullet('Horario', formatTime(classes[0].class_time)) : null,
      '',
      'Confirma que posso cancelar?',
    ]);
  }

  private async preparePayment(connection: BotConnection, context: TeacherContext, detected: DetectedIntent, originalMessage: string) {
    if (!detected.studentName || !detected.amount || detected.amount <= 0) {
      return botMessage([
        'Entendi que voce quer registrar um pagamento.',
        '',
        '*Falta informar:*',
        !detected.studentName ? '- Nome do aluno' : null,
        !detected.amount || detected.amount <= 0 ? '- Valor recebido' : null,
        '',
        'Exemplo: "registrar pagamento da Maria de 100 reais".',
      ]);
    }
    const { student, error } = this.dataContext.findStudent(context, detected.studentName);
    if (!student) return error || 'Nao encontrei esse aluno.';
    const action: BotPendingAction = {
      type: 'REGISTER_PAYMENT',
      intent: 'REGISTRAR_PAGAMENTO',
      teacher_id: connection.teacher_id,
      telegram_user_id: connection.telegram_user_id,
      entities: { ...(detected as Record<string, unknown>), originalMessage },
      student_id: student.id,
      student_name: student.full_name,
      student_user_id: student.user_id,
      amount: detected.amount,
      month_reference: monthReference(),
      summary: `registrar pagamento de ${currency(detected.amount)} para ${student.full_name}`,
      expires_at: pendingExpiration(),
      status: 'pending',
    };
    await this.state.set(connection, action);
    return botMessage([
      'Entendi o pagamento recebido.',
      '',
      '*Pagamento:*',
      bullet('Aluno', student.full_name),
      bullet('Valor', currency(detected.amount)),
      bullet('Mes de referencia', monthReference()),
      '',
      'Confirma que posso registrar esse pagamento?',
    ]);
  }

  private async prepareAbsence(connection: BotConnection, context: TeacherContext, detected: DetectedIntent, originalMessage: string) {
    const { student, error } = this.dataContext.findStudent(context, detected.studentName);
    if (!student) return error || 'Nao encontrei esse aluno.';
    const date = detected.date || todayDate();
    const action: BotPendingAction = {
      type: 'REGISTER_ABSENCE',
      intent: 'REGISTRAR_FALTA',
      teacher_id: connection.teacher_id,
      telegram_user_id: connection.telegram_user_id,
      entities: { ...(detected as Record<string, unknown>), originalMessage },
      student_id: student.id,
      student_name: student.full_name,
      class_date: date,
      summary: `registrar falta de ${student.full_name} em ${formatDate(date)}`,
      expires_at: pendingExpiration(),
      status: 'pending',
    };
    await this.state.set(connection, action);
    return botMessage([
      'Entendi o registro de falta.',
      '',
      '*Falta:*',
      bullet('Aluno', student.full_name),
      bullet('Data', formatDate(date)),
      '',
      'Confirma que posso registrar essa falta?',
    ]);
  }

  private async prepareNote(connection: BotConnection, context: TeacherContext, detected: DetectedIntent, originalMessage: string) {
    const { student, error } = this.dataContext.findStudent(context, detected.studentName);
    if (!student) return error || botMessage(['Para qual aluno devo criar essa anotacao?', '', 'Envie o nome do aluno para eu continuar.']);
    const note = detected.note || originalMessage;
    const action: BotPendingAction = {
      type: 'CREATE_NOTE',
      intent: 'CRIAR_ANOTACAO_AULA',
      teacher_id: connection.teacher_id,
      telegram_user_id: connection.telegram_user_id,
      entities: { ...(detected as Record<string, unknown>), originalMessage },
      student_id: student.id,
      student_name: student.full_name,
      note,
      summary: `criar anotacao para ${student.full_name}: "${note.slice(0, 120)}"`,
      expires_at: pendingExpiration(),
      status: 'pending',
    };
    await this.state.set(connection, action);
    return botMessage([
      'Entendi a anotacao.',
      '',
      '*Anotacao:*',
      bullet('Aluno', student.full_name),
      bullet('Texto', note.slice(0, 160)),
      '',
      'Confirma que posso salvar essa anotacao?',
    ]);
  }

  private async prepareDeleteHistory(connection: BotConnection) {
    const action: BotPendingAction = {
      type: 'DELETE_HISTORY',
      intent: 'APAGAR_HISTORICO',
      teacher_id: connection.teacher_id,
      telegram_user_id: connection.telegram_user_id,
      entities: {},
      summary: 'apagar o historico de conversas do LuminaBot para sua conta',
      expires_at: pendingExpiration(),
      status: 'pending',
    };
    await this.state.set(connection, action);
    return botMessage([
      'Entendi que voce quer apagar o historico do LumiBot.',
      '',
      '*Importante:*',
      '- Essa acao remove apenas o historico de conversas.',
      '- Alunos, aulas e pagamentos nao serao alterados.',
      '',
      'Confirma que posso apagar o historico?',
    ]);
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

export class BotMessageRouter {
  constructor(private assistant = new ConversationalAssistantService()) {}

  route(connection: BotConnection, message: string) {
    return this.assistant.handleMessage(connection, message);
  }
}

export class TelegramBotService {
  constructor(private router = new BotMessageRouter()) {}

  handleTextMessage(connection: BotConnection, text: string) {
    return this.router.route(connection, text);
  }
}
