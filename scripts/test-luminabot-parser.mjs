import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import zlib from 'node:zlib';
import ts from 'typescript';

const source = fs.readFileSync('src/lib/luminabot-assistant.ts', 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText;

const module = { exports: {} };
const sandbox = {
  require(id) {
    if (id === './supabase-admin') return { supabaseAdmin: {} };
    if (id === './google-calendar') {
      return {
        createOrUpdateGoogleEventForClass: async () => ({ synced: false }),
        createStandaloneGoogleCalendarEvent: async () => ({ synced: false }),
        deleteGoogleEventForClass: async () => ({ synced: false }),
        getValidGoogleConnection: async () => null,
        listGoogleCalendarEvents: async () => ({ connected: false, events: [] }),
        syncTeacherClassesToGoogle: async () => ({ synced: 0 }),
      };
    }
    if (id === './class-meeting') {
      return {
        ensureClassMeetingLink: async () => ({ meeting_url: 'https://meet.jit.si/luminaai-aula-teste' }),
        ensureFutureClassMeetingLinks: async () => ({ synced: 0, meetLinks: 0 }),
      };
    }
    if (id === 'zlib') return zlib;
    throw new Error(`Unexpected require: ${id}`);
  },
  exports: module.exports,
  module,
  console,
  Date,
  Intl,
  Map,
  Number,
  Promise,
  RegExp,
  Set,
  String,
};

vm.runInNewContext(compiled, sandbox, { filename: 'luminabot-assistant.js' });

const { CalendarTargetResolver, IntentDetectionService, DateTimeParserPTBR } = module.exports;
const detector = new IntentDetectionService();
const parser = new DateTimeParserPTBR();
const calendarTarget = new CalendarTargetResolver();

const cases = [
  ['marque uma aula com Joao amanha as 14h', 'CRIAR_AULA'],
  ['agenda a aula da Maria para sexta as 16h', 'CRIAR_AULA'],
  ['coloca o Pedro na agenda hoje as 18h', 'CRIAR_AULA'],
  ['marca aula com Ana segunda-feira as 10h', 'CRIAR_AULA'],
  ['preciso agendar uma aula com Carlos amanha de manha', 'CRIAR_AULA'],
  ['cria uma aula para Laura na quarta as 15h30', 'CRIAR_AULA'],
  ['coloca aula da Julia para depois de amanha as 9h', 'CRIAR_AULA'],
  ['agenda o Rafael para terca as 17h', 'CRIAR_AULA'],
  ['marca o aluno Joao para amanha as duas da tarde', 'CRIAR_AULA'],
  ['coloca a Maria no horario das 14h amanha', 'CRIAR_AULA'],

  ['como esta minha agenda de hoje?', 'CONSULTAR_AGENDA'],
  ['quais aulas eu tenho amanha?', 'CONSULTAR_AGENDA'],
  ['tenho aula hoje?', 'CONSULTAR_AGENDA'],
  ['me mostra minha agenda da semana', 'CONSULTAR_AGENDA'],
  ['quais horarios eu tenho livres amanha?', 'GOOGLE_CALENDAR_FIND_FREE_TIME'],
  ['tenho algum aluno marcado para sexta?', 'CONSULTAR_AGENDA'],
  ['quais sao minhas proximas aulas?', 'CONSULTAR_AGENDA'],
  ['me fala meus compromissos de hoje', 'CONSULTAR_AGENDA'],
  ['tem aula marcada para segunda?', 'CONSULTAR_AGENDA'],
  ['quero ver minha agenda do mes', 'CONSULTAR_AGENDA'],
  ['gere links das aulas futuras', 'GERAR_LINKS_AULAS'],
  ['mande o link da aula de hoje', 'ENVIAR_LINK_AULA'],
  ['qual e a sala da aula da Ana?', 'ENVIAR_LINK_AULA'],

  ['muda a aula do Joao para amanha as 15h', 'ALTERAR_AULA'],
  ['remarca a aula da Maria para sexta', 'ALTERAR_AULA'],
  ['troca o horario do Pedro para 16h', 'ALTERAR_AULA'],
  ['altera a aula da Ana de hoje para amanha', 'ALTERAR_AULA'],
  ['muda a aula da Laura para depois de amanha as 10h', 'ALTERAR_AULA'],
  ['consegue remarcar a aula do Rafael para segunda?', 'ALTERAR_AULA'],
  ['passa a aula da Julia para terca as 14h', 'ALTERAR_AULA'],
  ['troca a aula do Carlos para o periodo da tarde', 'ALTERAR_AULA'],
  ['quero mudar o horario da aula da Maria', 'ALTERAR_AULA'],
  ['reagenda a aula do Joao para semana que vem', 'ALTERAR_AULA'],

  ['cancela a aula do Joao de hoje', 'CANCELAR_AULA'],
  ['desmarca a aula da Maria amanha', 'CANCELAR_AULA'],
  ['remove a aula do Pedro da agenda', 'CANCELAR_AULA'],
  ['cancela meu horario com Ana as 15h', 'CANCELAR_AULA'],
  ['tira a aula da Laura da agenda', 'CANCELAR_AULA'],
  ['desmarca a aula de sexta do Rafael', 'CANCELAR_AULA'],
  ['cancela todas as aulas de hoje', 'CANCELAR_AULA'],
  ['preciso cancelar a aula da Julia', 'CANCELAR_AULA'],
  ['remove a aula de amanha do Carlos', 'CANCELAR_AULA'],
  ['cancela a aula das 14h', 'CANCELAR_AULA'],

  ['registra pagamento da Maria de 100 reais', 'REGISTRAR_PAGAMENTO'],
  ['Joao pagou 150 hoje', 'REGISTRAR_PAGAMENTO'],
  ['anota que o Pedro pagou R$120', 'REGISTRAR_PAGAMENTO'],
  ['recebi 200 da Ana', 'REGISTRAR_PAGAMENTO'],
  ['marca pagamento de 80 reais para Laura', 'REGISTRAR_PAGAMENTO'],
  ['registra que Rafael pagou a mensalidade', 'REGISTRAR_PAGAMENTO'],
  ['a Julia pagou 90 reais agora', 'REGISTRAR_PAGAMENTO'],
  ['adiciona pagamento do Carlos de R$250', 'REGISTRAR_PAGAMENTO'],
  ['recebi o valor da aula do Joao', 'REGISTRAR_PAGAMENTO'],
  ['coloca pagamento da Maria referente a julho', 'REGISTRAR_PAGAMENTO'],

  ['quanto eu recebi este mes?', 'CONSULTAR_FINANCEIRO'],
  ['quem esta com pagamento pendente?', 'LISTAR_PENDENCIAS'],
  ['me mostra meu financeiro de julho', 'CONSULTAR_FINANCEIRO'],
  ['tenho alunos devendo?', 'LISTAR_PENDENCIAS'],
  ['qual foi meu faturamento da semana?', 'CONSULTAR_FINANCEIRO'],
  ['quanto ainda tenho para receber?', 'CONSULTAR_FINANCEIRO'],
  ['me da um resumo financeiro completo', 'CONSULTAR_FINANCEIRO'],
  ['quais pagamentos estao atrasados?', 'LISTAR_PENDENCIAS'],
  ['quanto recebi no ano?', 'CONSULTAR_FINANCEIRO'],
  ['quero ver meus recebimentos do mes passado', 'CONSULTAR_FINANCEIRO'],

  ['Pedro faltou hoje', 'REGISTRAR_FALTA'],
  ['marca falta para Maria na aula de hoje', 'REGISTRAR_FALTA'],
  ['Joao nao veio na aula', 'REGISTRAR_FALTA'],
  ['registra ausencia da Ana', 'REGISTRAR_FALTA'],
  ['Laura faltou ontem', 'REGISTRAR_FALTA'],
  ['coloca falta para Rafael na aula de sexta', 'REGISTRAR_FALTA'],
  ['Julia nao compareceu hoje', 'REGISTRAR_FALTA'],
  ['Carlos avisou que nao vai vir, marca falta', 'REGISTRAR_FALTA'],
  ['registra que o aluno Joao faltou', 'REGISTRAR_FALTA'],
  ['anota ausencia da Maria na aula das 14h', 'REGISTRAR_FALTA'],

  ['faca um relatorio da Maria', 'GERAR_RELATORIO_ALUNO'],
  ['gera relatorio completo do Joao', 'GERAR_RELATORIO_ALUNO'],
  ['quero um resumo da evolucao do Pedro', 'GERAR_RELATORIO_ALUNO'],
  ['cria um relatorio da Ana para os pais', 'GERAR_RELATORIO_ALUNO'],
  ['como esta o desempenho da Laura?', 'GERAR_RELATORIO_ALUNO'],
  ['me mostra o historico do Rafael', 'GERAR_RELATORIO_ALUNO'],
  ['prepara um relatorio mensal da Julia', 'GERAR_RELATORIO_ALUNO'],
  ['faca um relatorio profissional do Carlos', 'GERAR_RELATORIO_ALUNO'],
  ['quero um texto sobre a evolucao da Maria', 'GERAR_RELATORIO_ALUNO'],
  ['gera um PDF com o desempenho do Joao', 'GERAR_RELATORIO_ALUNO'],

  ['relatorio dos alunos', 'GERAR_RELATORIO_ALUNOS'],
  ['gera uma planilha dos pagamentos pendentes', 'GERAR_RELATORIO_FINANCEIRO'],
  ['cria um grafico dos meus recebimentos', 'GERAR_RELATORIO_FINANCEIRO'],
  ['quero um relatorio financeiro em PDF', 'GERAR_RELATORIO_FINANCEIRO'],
  ['manda uma planilha com meus alunos ativos', 'GERAR_RELATORIO_ALUNOS'],
  ['faz um resumo geral da minha semana', 'ORGANIZAR_SEMANA'],
  ['gera um relatorio completo do mes', 'GERAR_RELATORIO_ALUNOS'],
  ['cria uma imagem com meu resumo financeiro', 'GERAR_RELATORIO_FINANCEIRO'],
  ['quero um grafico de faltas por aluno', 'GERAR_RELATORIO_ALUNOS'],
  ['me envie um relatorio anual das aulas', 'GERAR_RELATORIO_ALUNOS'],

  ['crie uma mensagem para a mae do Joao', 'GERAR_TEXTO_PARA_PAIS_OU_ALUNO'],
  ['escreva um aviso de falta para os responsaveis da Maria', 'GERAR_TEXTO_PARA_PAIS_OU_ALUNO'],
  ['me ajuda a organizar minha semana', 'ORGANIZAR_SEMANA'],
  ['o que eu preciso resolver hoje?', 'ORGANIZAR_SEMANA'],
  ['faca uma mensagem cobrando pagamento de forma educada', 'GERAR_TEXTO_PARA_PAIS_OU_ALUNO'],
  ['escreva uma mensagem confirmando aula com Pedro', 'GERAR_TEXTO_PARA_PAIS_OU_ALUNO'],
  ['me de sugestoes para melhorar minha rotina', 'ORGANIZAR_SEMANA'],
  ['crie um comunicado sobre remarcacao de aula', 'GERAR_TEXTO_PARA_PAIS_OU_ALUNO'],
  ['transforme esse relatorio em uma mensagem mais profissional', 'GERAR_TEXTO_PARA_PAIS_OU_ALUNO'],
  ['o que voce consegue fazer por mim?', 'PEDIR_AJUDA'],
];

for (const [phrase, expected] of cases) {
  const result = detector.detect(phrase);
  assert.equal(result.intent, expected, `${phrase} -> expected ${expected}, got ${result.intent}`);
}

const classByAgenda = detector.detect('Agenda a aula do joao para amanha as 14h');
assert.equal(classByAgenda.intent, 'CRIAR_AULA');
assert.equal(classByAgenda.studentName, 'joao');
assert.equal(classByAgenda.time, '14:00:00');
assert.equal(classByAgenda.targetCalendar, 'UNSPECIFIED');

assert.equal(detector.detect('marque uma aula com Joao no app amanha as 14h').targetCalendar, 'LUMINAI');
assert.equal(detector.detect('marque uma aula com Joao no Google Agenda amanha as 14h').targetCalendar, 'GOOGLE_CALENDAR');
assert.equal(detector.detect('marque uma aula com Joao nos dois amanha as 14h').targetCalendar, 'BOTH');
assert.equal(detector.detect('como esta minha agenda da LuminaAI hoje?').targetCalendar, 'LUMINAI');
assert.equal(detector.detect('como esta minha agenda do Google hoje?').targetCalendar, 'GOOGLE_CALENDAR');
assert.equal(detector.detect('consulta as duas agendas hoje').targetCalendar, 'BOTH');

assert.equal(calendarTarget.fromChoice('1'), 'LUMINAI');
assert.equal(calendarTarget.fromChoice('no app'), 'LUMINAI');
assert.equal(calendarTarget.fromChoice('2'), 'GOOGLE_CALENDAR');
assert.equal(calendarTarget.fromChoice('no Google'), 'GOOGLE_CALENDAR');
assert.equal(calendarTarget.fromChoice('3'), 'BOTH');
assert.equal(calendarTarget.fromChoice('nos dois'), 'BOTH');

const payment = detector.detect('registrar pagamento da maria de 100 reais');
assert.equal(payment.studentName, 'maria');
assert.equal(payment.amount, 100);

const financialSpreadsheet = detector.detect('me mande uma planilha com o relatorio financeiro mensal');
assert.equal(financialSpreadsheet.intent, 'GERAR_RELATORIO_FINANCEIRO');
assert.equal(financialSpreadsheet.artifactType, 'spreadsheet');

const financialChart = detector.detect('cria um grafico dos meus recebimentos');
assert.equal(financialChart.intent, 'GERAR_RELATORIO_FINANCEIRO');
assert.equal(financialChart.artifactType, 'chart');

const financialChartPhoto = detector.detect('cria uma foto com o grafico dos meus recebimentos');
assert.equal(financialChartPhoto.intent, 'GERAR_RELATORIO_FINANCEIRO');
assert.equal(financialChartPhoto.artifactType, 'chart');
assert.equal(financialChartPhoto.artifactDelivery, 'photo');

const studentDocument = detector.detect('gera um documento com o desempenho do Joao');
assert.equal(studentDocument.intent, 'GERAR_RELATORIO_ALUNO');
assert.equal(studentDocument.artifactType, 'document');

const emailRequest = detector.detect('mande um email para Ana confirmando a aula');
assert.equal(emailRequest.intent, 'GERAR_TEXTO_PARA_PAIS_OU_ALUNO');
assert.equal(emailRequest.studentName, 'Ana');

const draftRequest = detector.detect('crie um email para Ana cobrando pagamento');
assert.equal(draftRequest.intent, 'GERAR_TEXTO_PARA_PAIS_OU_ALUNO');
assert.equal(draftRequest.studentName, 'Ana');

const searchEmailRequest = detector.detect('procure emails da Ana');
assert.equal(searchEmailRequest.intent, 'CONVERSA_GERAL');

assert.equal(parser.parseTime('as 15h30'), '15:30:00');
assert.equal(parser.parseTime('as duas da tarde'), '14:00:00');

console.log(`LumiBot parser tests passed: ${cases.length} training phrases`);
