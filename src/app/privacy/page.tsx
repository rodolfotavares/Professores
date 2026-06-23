import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="marketing-page legal-page">
      <section className="card legal-card stack">
        <span className="eyebrow">LuminaAI</span>
        <h1>Politica de Privacidade</h1>
        <p className="muted">Ultima atualizacao: 23 de junho de 2026.</p>

        <h2>Dados coletados</h2>
        <p>O LuminaAI coleta dados necessarios para funcionamento do portal, como nome, e-mail, WhatsApp, perfil de professor ou aluno, agenda de aulas, atividades, mensagens, arquivos enviados e informacoes de pagamento da assinatura do professor.</p>

        <h2>Uso do Google Agenda</h2>
        <p>Quando o professor conecta o Google Agenda, o LuminaAI usa a permissao concedida apenas para criar e atualizar eventos de aulas agendadas. O app nao vende dados do Google, nao usa esses dados para publicidade e nao compartilha essas informacoes com terceiros fora da operacao do servico.</p>

        <h2>Finalidade</h2>
        <p>Os dados sao usados para organizar aulas particulares, vincular professor e aluno, mostrar atividades, registrar mensagens, sincronizar agenda e permitir o controle financeiro do professor.</p>

        <h2>Armazenamento e seguranca</h2>
        <p>Os dados sao armazenados em servicos de nuvem usados pelo LuminaAI, com autenticacao e controles de acesso. Tokens de integracao, quando usados, sao armazenados para manter a conexao autorizada pelo usuario.</p>

        <h2>Controle do usuario</h2>
        <p>O usuario pode solicitar suporte, correcao ou remocao de dados entrando em contato pelo WhatsApp informado na area de Suporte do app.</p>

        <h2>Contato</h2>
        <p>Para duvidas sobre privacidade, suporte ou uso dos dados, entre em contato pelo WhatsApp: +1 (402) 366-7683.</p>

        <Link className="btn primary" href="/">Voltar ao inicio</Link>
      </section>
    </main>
  );
}
