import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="marketing-page legal-page">
      <section className="card legal-card stack">
        <span className="eyebrow">LuminaAI</span>
        <h1>Termos de Uso</h1>
        <p className="muted">Ultima atualizacao: 23 de junho de 2026.</p>

        <h2>Uso do servico</h2>
        <p>O LuminaAI e uma plataforma para professores particulares organizarem alunos, agenda, atividades, mensagens, arquivos e previsoes financeiras. O usuario deve fornecer informacoes verdadeiras e manter suas credenciais seguras.</p>

        <h2>Assinatura</h2>
        <p>Professores novos podem precisar manter assinatura mensal ativa para usar as funcoes do portal. Professores marcados como isentos permanecem liberados conforme configuracao administrativa do app.</p>

        <h2>Responsabilidades</h2>
        <p>O professor e responsavel pelo conteudo enviado aos alunos, pelo cadastro de aulas, pela comunicacao e pela gestao dos proprios pagamentos externos. O aluno e responsavel pelas respostas e arquivos enviados.</p>

        <h2>Integracoes</h2>
        <p>Integracoes como Google Agenda e Mercado Pago dependem de servicos externos. O LuminaAI usa essas integracoes apenas para executar as acoes solicitadas pelo usuario dentro do app.</p>

        <h2>Limitacoes</h2>
        <p>O app pode passar por manutencao, alteracoes e melhorias. O LuminaAI nao garante disponibilidade ininterrupta de servicos externos conectados.</p>

        <h2>Contato</h2>
        <p>Para suporte, duvidas ou solicitacoes, entre em contato pelo WhatsApp: +1 (402) 366-7683.</p>

        <Link className="btn primary" href="/">Voltar ao inicio</Link>
      </section>
    </main>
  );
}
