import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="marketing-page legal-page">
      <section className="card legal-card stack">
        <span className="eyebrow">LuminaAI</span>
        <h1>Termos de Uso</h1>
        <p className="muted">Ultima atualizacao: 13 de julho de 2026.</p>

        <h2>1. Aceite</h2>
        <p>
          Ao criar conta, acessar ou usar o LuminaAI, o usuario declara que leu e concorda com estes Termos e com a Politica de Privacidade.
          Caso nao concorde, deve interromper o uso da plataforma.
        </p>

        <h2>2. O que e o LuminaAI</h2>
        <p>
          O LuminaAI e uma plataforma para professores particulares organizarem alunos, agenda, mensagens, relatorios de aula, evolucao pedagogica e controle financeiro.
          O app nao substitui a atuacao pedagogica, profissional, contabil, juridica ou administrativa do professor.
        </p>

        <h2>3. Contas e seguranca</h2>
        <p>
          Cada usuario deve manter seus dados atualizados, usar senha forte, proteger o dispositivo e nao compartilhar credenciais.
          A troca de senha exige confirmacao da senha atual quando feita dentro da conta.
        </p>

        <h2>4. Professores, alunos e responsaveis</h2>
        <p>
          O professor e responsavel por cadastrar alunos apenas quando tiver autorizacao adequada ou outra base legal aplicavel.
          O aluno deve usar o portal apenas para acompanhar informacoes relacionadas as suas aulas.
          Um aluno pode manter vinculos com mais de um professor, desde que aceite convite ou seja vinculado de forma legitima.
        </p>

        <h2>5. Convites de alunos</h2>
        <p>
          O professor pode gerar convites temporarios para conectar alunos. O aluno pode criar o proprio login e e-mail, e esse e-mail pode atualizar o cadastro exibido ao professor.
          Convites sao pessoais, temporarios e nao devem ser publicados em locais abertos.
        </p>

        <h2>6. Uso correto</h2>
        <p>
          E proibido usar o LuminaAI para conteudo ilicito, discriminatorio, ofensivo, invasivo, publicitario nao solicitado, violacao de privacidade, compartilhamento indevido de dados, tentativa de invasao ou finalidade fora da rotina educacional proposta.
        </p>

        <h2>7. Conteudos enviados</h2>
        <p>
          Professores e alunos sao responsaveis pelos textos, arquivos, imagens, videos, relatorios e informacoes que enviam ao app.
          O LuminaAI pode armazenar esses conteudos para permitir historico, acompanhamento pedagogico e funcionamento das funcionalidades contratadas.
        </p>

        <h2>8. Recursos de inteligencia artificial</h2>
        <p>
          A IA pode auxiliar em relatorios, mensagens, analises de evolucao e organizacao de rotina.
          As respostas podem conter erros ou interpretacoes incompletas, por isso o professor deve revisar qualquer conteudo antes de usar, publicar ou enviar a alunos e responsaveis.
        </p>

        <h2>9. Assinatura, teste e pagamento</h2>
        <p>
          Professores novos podem ter periodo gratuito de teste. Apos o teste, o acesso do professor pode depender do pagamento mensal informado na tela Financeiro.
          O valor atual da mensalidade do app e R$ 19,90, salvo promocao, isencao, ajuste futuro informado no app ou acordo especifico.
        </p>

        <h2>10. Cancelamento</h2>
        <p>
          Se a cobranca nao for recorrente automatica, o professor pode interromper a continuidade deixando de pagar o proximo periodo.
          Se futuramente houver assinatura recorrente, o app devera disponibilizar meio de cancelamento ou suporte para cancelamento.
          O periodo ja pago permanece liberado ate o fim da competencia contratada, salvo estorno, fraude, contestacao ou acordo de suporte.
        </p>

        <h2>11. Integracoes externas</h2>
        <p>
          Servicos como Supabase, Vercel, Mercado Pago, notificacoes do navegador, links de aula e eventuais integracoes externas possuem politicas proprias.
          O LuminaAI usa integracoes para executar acoes solicitadas pelo usuario e pode depender da disponibilidade desses terceiros.
        </p>

        <h2>12. Disponibilidade</h2>
        <p>
          O app pode passar por manutencao, atualizacoes, alteracoes de layout e ajustes de funcionalidades.
          Nao garantimos disponibilidade ininterrupta, especialmente quando a falha depender de internet, dispositivo, navegador, provedor de nuvem ou servico externo.
        </p>

        <h2>13. Limitacao de responsabilidade</h2>
        <p>
          O LuminaAI nao se responsabiliza por decisoes pedagogicas, cobrancas feitas diretamente entre professor e aluno, dados incorretos cadastrados pelo usuario, perda decorrente de mau uso da conta ou conteudo enviado sem autorizacao.
          Nada nestes Termos limita direitos que nao possam ser limitados pela legislacao aplicavel.
        </p>

        <h2>14. Privacidade e LGPD</h2>
        <p>
          O tratamento de dados pessoais e descrito na Politica de Privacidade.
          Usuarios podem solicitar acesso, correcao, exclusao, portabilidade quando aplicavel, revogacao de consentimento e informacoes sobre compartilhamento pelo canal de suporte.
        </p>

        <h2>15. Suporte</h2>
        <p>
          Para duvidas, suporte, cancelamento, reembolso, privacidade ou exercicio de direitos relacionados a dados pessoais, entre em contato pelo WhatsApp: +1 (402) 366-7683.
        </p>

        <Link className="btn primary" href="/">Voltar ao inicio</Link>
      </section>
    </main>
  );
}
