import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="marketing-page legal-page">
      <section className="card legal-card stack">
        <span className="eyebrow">LuminaAI</span>
        <h1>Politica de Privacidade</h1>
        <p className="muted">Ultima atualizacao: 13 de julho de 2026.</p>

        <h2>1. Compromisso com a privacidade</h2>
        <p>
          O LuminaAI trata dados pessoais para oferecer uma plataforma de organizacao de aulas particulares para professores, alunos e responsaveis.
          Esta Politica explica quais dados podem ser tratados, para quais finalidades, com quem podem ser compartilhados e como o titular pode exercer seus direitos previstos na LGPD.
        </p>

        <h2>2. Papeis no tratamento de dados</h2>
        <p>
          O LuminaAI atua como fornecedor da plataforma. O professor e responsavel pelos dados que cadastra sobre alunos, responsaveis, aulas, mensagens, pagamentos e relatorios.
          Em muitas situacoes, o professor define a finalidade do tratamento, e o LuminaAI opera os dados para executar o servico solicitado.
        </p>

        <h2>3. Dados tratados</h2>
        <p>
          Podemos tratar nome, e-mail, telefone, WhatsApp, tipo de perfil, dados do responsavel, materia, serie, agenda, frequencia, mensagens, arquivos, relatorios de aula, evolucao pedagogica, status de pagamentos, preferencias de idioma, tokens de convite, registros de conexao e dados tecnicos necessarios para seguranca e funcionamento.
        </p>

        <h2>4. Alunos menores de idade</h2>
        <p>
          Quando houver dados de criancas ou adolescentes, o professor deve possuir autorizacao do responsavel legal ou outra base legal aplicavel.
          Recomendamos cadastrar apenas informacoes necessarias para organizar aulas, comunicar responsaveis e acompanhar a evolucao pedagogica, sempre observando o melhor interesse do aluno.
        </p>

        <h2>5. Finalidades</h2>
        <p>
          Os dados sao usados para criar e proteger contas, vincular professores e alunos, permitir multiplos vinculos de um aluno com professores diferentes, organizar agenda, enviar mensagens, armazenar arquivos, gerar relatorios, apoiar analises pedagogicas, controlar pagamentos, enviar notificacoes, prestar suporte, prevenir fraude e cumprir obrigacoes legais.
        </p>

        <h2>6. Bases legais</h2>
        <p>
          O tratamento pode ocorrer para execucao do servico, cumprimento de obrigacao legal ou regulatoria, exercicio regular de direitos, legitimo interesse, prevencao a fraude, consentimento quando necessario e protecao do melhor interesse de criancas e adolescentes.
        </p>

        <h2>7. Convites e vinculos</h2>
        <p>
          Professores podem gerar links de convite para vincular alunos. O aluno pode criar seu proprio login e e-mail; quando isso acontecer, o cadastro do professor sera atualizado com o e-mail informado pelo aluno.
          Tokens de convite sao temporarios, de uso unico e nao devem conter dados sensiveis.
        </p>

        <h2>8. Inteligencia artificial</h2>
        <p>
          Recursos de IA podem auxiliar na organizacao de relatorios, identificacao de padroes de duvidas, sugestoes pedagogicas e mensagens.
          Essas analises sao auxiliares, podem conter erros e devem ser revisadas pelo professor antes de qualquer decisao relevante ou compartilhamento com alunos e responsaveis.
        </p>

        <h2>9. Compartilhamento com terceiros</h2>
        <p>
          Dados podem ser compartilhados com provedores necessarios ao funcionamento do app, como hospedagem, banco de dados, autenticacao, armazenamento, pagamentos, notificacoes, links de aula e ferramentas de suporte ou IA.
          O LuminaAI nao vende dados pessoais e nao usa dados de alunos para publicidade comportamental.
        </p>

        <h2>10. Pagamentos, notificacoes e integracoes</h2>
        <p>
          O Mercado Pago pode processar pagamentos da assinatura do professor conforme suas proprias politicas.
          Notificacoes dependem da permissao do navegador ou dispositivo e podem ser desativadas pelo usuario.
          Integracoes externas so devem ser usadas para finalidades solicitadas pelo usuario.
        </p>

        <h2>11. Retencao e exclusao</h2>
        <p>
          Os dados sao mantidos enquanto a conta estiver ativa ou enquanto forem necessarios para prestacao do servico, historico, seguranca, cumprimento de obrigacoes legais, prevencao de fraude ou defesa de direitos.
          Pedidos de exclusao serao avaliados conforme a LGPD, podendo haver preservacao de dados minimos quando existir obrigacao legal ou necessidade legitima.
        </p>

        <h2>12. Seguranca</h2>
        <p>
          Utilizamos autenticacao, controle de acesso por perfil, tokens temporarios para convites, servicos de nuvem, restricoes de permissao e medidas tecnicas razoaveis para proteger dados pessoais.
          Nenhum sistema e totalmente imune a falhas; por isso, usuarios devem manter senhas fortes, nao compartilhar credenciais e proteger seus dispositivos.
        </p>

        <h2>13. Direitos do titular</h2>
        <p>
          O titular pode solicitar confirmacao de tratamento, acesso, correcao, anonimização, bloqueio, eliminacao de dados desnecessarios, portabilidade quando aplicavel, informacoes sobre compartilhamento, revogacao de consentimento, oposicao a tratamento irregular e revisao de decisoes automatizadas relevantes.
        </p>

        <h2>14. Como exercer direitos</h2>
        <p>
          Solicitacoes de privacidade podem ser enviadas pelo WhatsApp +1 (402) 366-7683.
          Para proteger contas e dados, poderemos solicitar informacoes adicionais para confirmar a identidade do solicitante antes de alterar, exportar ou excluir informacoes.
        </p>

        <h2>15. Atualizacoes</h2>
        <p>
          Esta Politica pode ser atualizada para refletir mudancas no app, na lei ou nos servicos utilizados.
          A versao vigente sera publicada nesta pagina com a data de atualizacao.
        </p>

        <Link className="btn primary" href="/">Voltar ao inicio</Link>
      </section>
    </main>
  );
}
