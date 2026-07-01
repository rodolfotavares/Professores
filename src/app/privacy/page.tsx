import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="marketing-page legal-page">
      <section className="card legal-card stack">
        <span className="eyebrow">LuminaAI</span>
        <h1>Politica de Privacidade</h1>
        <p className="muted">Última atualizacao: 23 de junho de 2026.</p>

        <h2>Dados coletados</h2>
        <p>O LuminaAI coleta dados necessarios para funcionamento do portal, como nome, e-mail, WhatsApp, perfil de professor ou aluno, agenda de aulas, atividades, mensagens, arquivos enviados e informações de pagamento da assinatura do professor.</p>

        <h2>Uso do Google Agenda</h2>
        <p>Quando o professor conecta o Google Agenda, o LuminaAI usa a permissão concedida apenas para criar e atualizar eventos de aulas agendadas. O app não vende dados do Google, não usa esses dados para publicidade e não compartilha essas informações com terceiros fora da operação do serviço.</p>

        <h2>Finalidade</h2>
        <p>Os dados são usados para organizar aulas particulares, vincular professor e aluno, mostrar atividades, registrar mensagens, sincronizar agenda e permitir o controle financeiro do professor.</p>

        <h2>Armazenamento e segurança</h2>
        <p>Os dados são armazenados em serviços de nuvem usados pelo LuminaAI, com autenticacao e controles de acesso. Tokens de integracao, quando usados, são armazenados para manter a conexao autorizada pelo usuario.</p>

        <h2>Controle do usuario</h2>
        <p>O usuario pode solicitar suporte, correcao ou remocao de dados entrando em contato pelo WhatsApp informado na área de Suporte do app.</p>

        <h2>Contato</h2>
        <p>Para dúvidas sobre privacidade, suporte ou uso dos dados, entre em contato pelo WhatsApp: +1 (402) 366-7683.</p>

        <Link className="btn primary" href="/">Voltar ao inicio</Link>
      </section>
    </main>
  );
}
