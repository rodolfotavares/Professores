import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
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

const { IntentDetectionService, DateTimeParserPTBR } = module.exports;
const detector = new IntentDetectionService();
const parser = new DateTimeParserPTBR();

const classByMark = detector.detect('marque a aula do joao para amanha as 14h');
assert.equal(classByMark.intent, 'CRIAR_AULA');
assert.equal(classByMark.studentName, 'joao');
assert.equal(classByMark.time, '14:00:00');

const classByAgenda = detector.detect('Agenda a aula do joao para amanha as 14h');
assert.equal(classByAgenda.intent, 'CRIAR_AULA');
assert.equal(classByAgenda.studentName, 'joao');
assert.equal(classByAgenda.time, '14:00:00');

const agendaQuery = detector.detect('Como esta minha agenda de hoje?');
assert.equal(agendaQuery.intent, 'CONSULTAR_AGENDA');

const payment = detector.detect('registrar pagamento da maria de 100 reais');
assert.equal(payment.intent, 'REGISTRAR_PAGAMENTO');
assert.equal(payment.studentName, 'maria');
assert.equal(payment.amount, 100);

const financialReport = detector.detect('relatorio financeiro mensal completo');
assert.equal(financialReport.intent, 'GERAR_RELATORIO_FINANCEIRO');
assert.equal(financialReport.period, 'mes atual');

const studentsReport = detector.detect('relatorio dos alunos');
assert.equal(studentsReport.intent, 'GERAR_RELATORIO_ALUNOS');

const singleReport = detector.detect('relatorio da Maria');
assert.equal(singleReport.intent, 'GERAR_RELATORIO_ALUNO');
assert.equal(singleReport.studentName, 'Maria');

const pending = detector.detect('Tenho algum aluno com pagamento atrasado?');
assert.equal(pending.intent, 'LISTAR_PENDENCIAS');

assert.equal(parser.parseTime('as 15h30'), '15:30:00');

console.log('LumiBot parser tests passed');
