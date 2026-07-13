import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="marketing-page legal-page">
      <section className="card legal-card stack">
        <span className="eyebrow">LuminaAI</span>
        <h1>Política de Privacidade</h1>
        <p className="muted">Última atualização: 13 de julho de 2026.</p>

        <h2>1. Compromisso com a privacidade</h2>
        <p>
          O LuminaAI trata dados pessoais para oferecer uma plataforma de organização de aulas particulares para professores, alunos e responsáveis.
          Esta Política explica quais dados podem ser tratados, para quais finalidades, com quem podem ser compartilhados e como o titular pode exercer seus direitos previstos na LGPD.
        </p>

        <h2>2. Papeis no tratamento de dados</h2>
        <p>
          O LuminaAI atua como fornecedor da plataforma. O professor e responsável pelos dados que cadastra sobre alunos, responsáveis, aulas, mensagens, pagamentos e relatórios.
          Em muitas situacoes, o professor define a finalidade do tratamento, e o LuminaAI opera os dados para executar o serviço solicitado.
        </p>

        <h2>3. Dados tratados</h2>
        <p>
          Podemos tratar nome, e-mail, telefone, WhatsApp, tipo de perfil, dados do responsável, matéria, série, agenda, frequência, mensagens, arquivos, relatórios de aula, evolução pedagógica, status de pagamentos, preferências de idioma, tokens de convite, registros de conexão e dados técnicos necessários para segurança e funcionamento.
        </p>

        <h2>4. Alunos menores de idade</h2>
        <p>
          Quando houver dados de crianças ou adolescentes, o professor deve possuir autorização do responsável legal ou outra base legal aplicável.
          Recomendamos cadastrar apenas informações necessárias para organizar aulas, comunicar responsáveis e acompanhar a evolução pedagógica, sempre observando o melhor interesse do aluno.
        </p>

        <h2>5. Finalidades</h2>
        <p>
          Os dados são usados para criar e proteger contas, vincular professores e alunos, permitir múltiplos vínculos de um aluno com professores diferentes, organizar agenda, enviar mensagens, armazenar arquivos, gerar relatórios, apoiar análises pedagógicas, controlar pagamentos, enviar notificações, prestar suporte, prevenir fraude e cumprir obrigações legais.
        </p>

        <h2>6. Bases legais</h2>
        <p>
          O tratamento pode ocorrer para execução do serviço, cumprimento de obrigação legal ou regulatória, exercício regular de direitos, legítimo interesse, prevenção a fraude, consentimento quando necessário e proteção do melhor interesse de crianças e adolescentes.
        </p>

        <h2>7. Convites e vínculos</h2>
        <p>
          Professores podem gerar links de convite para vincular alunos. O aluno pode criar seu próprio login e e-mail; quando isso acontecer, o cadastro do professor sera atualizado com o e-mail informado pelo aluno.
          Tokens de convite são temporários, de uso único e não devem conter dados sensíveis.
        </p>

        <h2>8. Inteligencia artificial</h2>
        <p>
          Recursos de IA podem auxiliar na organização de relatórios, identificação de padrões de dúvidas, sugestões pedagógicas e mensagens.
          Essas análises são auxiliares, podem conter erros e devem ser revisadas pelo professor antes de qualquer decisão relevante ou compartilhamento com alunos e responsáveis.
        </p>

        <h2>9. Compartilhamento com terceiros</h2>
        <p>
          Dados podem ser compartilhados com provedores necessários ao funcionamento do app, como hospedagem, banco de dados, autenticação, armazenamento, pagamentos, notificações, links de aula e ferramentas de suporte ou IA.
          O LuminaAI não vende dados pessoais e não usa dados de alunos para publicidade comportamental.
        </p>

        <h2>10. Pagamentos, notificações e integrações</h2>
        <p>
          O Mercado Pago pode processar pagamentos da assinatura do professor conforme suas próprias políticas.
          Notificacoes dependem da permissão do navegador ou dispositivo e podem ser desativadas pelo usuário.
          Integracoes externas so devem ser usadas para finalidades solicitadas pelo usuário.
        </p>

        <h2>11. Retenção e exclusão</h2>
        <p>
          Os dados são mantidos enquanto a conta estiver ativa ou enquanto forem necessários para prestação do serviço, histórico, segurança, cumprimento de obrigações legais, prevenção de fraude ou defesa de direitos.
          Pedidos de exclusão serao avaliados conforme a LGPD, podendo haver preservação de dados mínimos quando existir obrigação legal ou necessidade legítima.
        </p>

        <h2>12. Seguranca</h2>
        <p>
          Utilizamos autenticação, controle de acesso por perfil, tokens temporários para convites, serviços de nuvem, restrições de permissão e medidas tecnicas razoáveis para proteger dados pessoais.
          Nenhum sistema e totalmente imune a falhas; por isso, usuários devem manter senhas fortes, não compartilhar credenciais e proteger seus dispositivos.
        </p>

        <h2>13. Direitos do titular</h2>
        <p>
          O titular pode solicitar confirmação de tratamento, acesso, correção, anonimização, bloqueio, eliminação de dados desnecessários, portabilidade quando aplicável, informações sobre compartilhamento, revogação de consentimento, oposição a tratamento irregular e revisão de decisões automatizadas relevantes.
        </p>

        <h2>14. Como exercer direitos</h2>
        <p>
          Solicitações de privacidade podem ser enviadas pelo WhatsApp +1 (402) 366-7683.
          Para proteger contas e dados, poderemos solicitar informações adicionais para confirmar a identidade do solicitante antes de alterar, exportar ou excluir informações.
        </p>

        <h2>15. Atualizacoes</h2>
        <p>
          Esta Política pode ser atualizada para refletir mudancas no app, na lei ou nos serviços utilizados.
          A versão vigente sera publicada nesta página com a data de atualizacao.
        </p>

        <Link className="btn primary" href="/">Voltar ao inicio</Link>
      </section>
    </main>
  );
}
