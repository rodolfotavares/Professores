import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="marketing-page legal-page">
      <section className="card legal-card stack">
        <span className="eyebrow">LuminaAI</span>
        <h1>Política de Privacidade</h1>
        <p className="muted">Última atualização: 7 de julho de 2026.</p>

        <h2>1. Compromisso com a privacidade</h2>
        <p>
          O LuminaAI trata dados pessoais para entregar uma plataforma educacional a professores particulares, alunos e responsáveis.
          Esta política explica quais dados são usados, por quais motivos, com quem podem ser compartilhados e como o usuário pode exercer seus direitos conforme a Lei Geral de Proteção de Dados Pessoais (LGPD).
        </p>

        <h2>2. Quem controla os dados</h2>
        <p>
          O LuminaAI atua como fornecedor da plataforma. O professor é responsável pelos dados que cadastra sobre seus alunos, responsáveis, aulas, mensagens e relatórios.
          Em muitas situações, o professor define a finalidade do cadastro e o LuminaAI opera os dados para executar o serviço contratado.
        </p>

        <h2>3. Dados que podemos coletar</h2>
        <p>
          Podemos tratar nome, e-mail, telefone, WhatsApp, tipo de perfil, dados de aluno, dados do responsável, matéria, série, idade, agenda, frequência, mensagens, arquivos, relatórios de aula, evolução pedagógica, status de pagamentos, dados técnicos do dispositivo, registros de login e permissões de notificações.
        </p>

        <h2>4. Dados de crianças e adolescentes</h2>
        <p>
          Quando houver cadastro de aluno menor de idade, o professor deve garantir que possui autorização do responsável legal.
          O LuminaAI recomenda cadastrar somente dados necessários para organização das aulas, comunicação com o responsável e acompanhamento pedagógico.
        </p>

        <h2>5. Finalidades do tratamento</h2>
        <p>
          Os dados são usados para criar contas, vincular professor e aluno, organizar agenda, enviar mensagens, armazenar arquivos, gerar relatórios de aula, medir evolução, controlar pagamentos, enviar notificações, prestar suporte, manter segurança, prevenir fraude e cumprir obrigações legais ou regulatórias.
        </p>

        <h2>6. Bases legais</h2>
        <p>
          O tratamento pode ocorrer para execução do serviço solicitado, cumprimento de obrigação legal, exercício regular de direitos, legítimo interesse, proteção contra fraude, consentimento quando necessário e, em caso de menores, observando o melhor interesse da criança ou adolescente.
        </p>

        <h2>7. Inteligência artificial</h2>
        <p>
          A IA pode analisar relatórios, dúvidas recorrentes e descrições de aula para sugerir evolução, pontos de reforço e mensagens.
          A análise é auxiliar e deve ser revisada pelo professor. O usuário pode solicitar informações ou revisão humana sobre resultados relevantes gerados por automação.
        </p>

        <h2>8. Compartilhamento de dados</h2>
        <p>
          Dados podem ser compartilhados com provedores necessários para funcionamento do app, como hospedagem, banco de dados, autenticação, armazenamento, pagamentos, links de aula, notificações e ferramentas de IA.
          O LuminaAI não vende dados pessoais e não usa dados de agenda para publicidade.
        </p>

        <h2>9. Agenda, Mercado Pago e notificações</h2>
        <p>
          O app pode gerar links para adicionar aulas ao Google Agenda sem solicitar permissões sensíveis da conta Google.
          O Mercado Pago processa pagamentos da assinatura do professor conforme suas próprias políticas.
          Push notifications dependem da permissão do navegador e podem ser desativadas a qualquer momento nas configurações do dispositivo.
        </p>

        <h2>10. Armazenamento e retenção</h2>
        <p>
          Os dados são mantidos enquanto a conta estiver ativa ou enquanto forem necessários para prestação do serviço, segurança, histórico, cumprimento de obrigação legal, prevenção de fraude ou defesa de direitos.
          Solicitações de exclusão serão avaliadas conforme a LGPD e podem preservar dados mínimos quando houver obrigação legal ou necessidade legítima.
        </p>

        <h2>11. Segurança</h2>
        <p>
          Usamos autenticação, controles de acesso, serviços de nuvem, permissões por perfil e medidas técnicas razoáveis para proteger os dados.
          Nenhum sistema é totalmente imune a falhas, por isso o usuário também deve manter senha segura, dispositivo protegido e não compartilhar credenciais.
        </p>

        <h2>12. Direitos do titular</h2>
        <p>
          O titular pode solicitar confirmação de tratamento, acesso, correção, anonimização, bloqueio ou eliminação de dados desnecessários, portabilidade quando aplicável, informação sobre compartilhamento, revogação de consentimento, oposição a tratamento irregular e revisão de decisões automatizadas relevantes.
        </p>

        <h2>13. Como exercer seus direitos</h2>
        <p>
          Solicitações de privacidade podem ser enviadas pelo WhatsApp +1 (402) 366-7683.
          Para proteger a conta, poderemos pedir informações adicionais para confirmar a identidade do solicitante antes de alterar, exportar ou excluir dados.
        </p>

        <h2>14. Alterações nesta política</h2>
        <p>
          Esta política pode ser atualizada para refletir mudanças no app, na lei ou nos serviços usados.
          A data de atualização será exibida nesta página.
        </p>

        <Link className="btn primary" href="/">Voltar ao início</Link>
      </section>
    </main>
  );
}
