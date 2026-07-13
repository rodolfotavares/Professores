import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="marketing-page legal-page">
      <section className="card legal-card stack">
        <span className="eyebrow">LuminaAI</span>
        <h1>Termos de Uso</h1>
        <p className="muted">Última atualização: 13 de julho de 2026.</p>

        <h2>1. Aceite</h2>
        <p>
          Ao criar conta, acessar ou usar o LuminaAI, o usuário declara que leu e concorda com estes Termos e com a Política de Privacidade.
          Caso não concorde, deve interromper o uso da plataforma.
        </p>

        <h2>2. O que e o LuminaAI</h2>
        <p>
          O LuminaAI é uma plataforma para professores particulares organizarem alunos, agenda, mensagens, relatórios de aula, evolução pedagógica e controle financeiro.
          O app não substitui a atuação pedagógica, profissional, contábil, jurídica ou administrativa do professor.
        </p>

        <h2>3. Contas e segurança</h2>
        <p>
          Cada usuário deve manter seus dados atualizados, usar senha forte, proteger o dispositivo e não compartilhar credenciais.
          A troca de senha exige confirmação da senha atual quando feita dentro da conta.
        </p>

        <h2>4. Professores, alunos e responsáveis</h2>
        <p>
          O professor e responsável por cadastrar alunos apenas quando tiver autorização adequada ou outra base legal aplicável.
          O aluno deve usar o portal apenas para acompanhar informações relacionadas as suas aulas.
          Um aluno pode manter vínculos com mais de um professor, desde que aceite convite ou seja vinculado de forma legítima.
        </p>

        <h2>5. Convites de alunos</h2>
        <p>
          O professor pode gerar convites temporários para conectar alunos. O aluno pode criar o próprio login e e-mail, e esse e-mail pode atualizar o cadastro exibido ao professor.
          Convites são pessoais, temporários e não devem ser publicados em locais abertos.
        </p>

        <h2>6. Uso correto</h2>
        <p>
          E proibido usar o LuminaAI para conteúdo ilícito, discriminatório, ofensivo, invasivo, publicitário não solicitado, violação de privacidade, compartilhamento indevido de dados, tentativa de invasão ou finalidade fora da rotina educacional proposta.
        </p>

        <h2>7. Conteudos enviados</h2>
        <p>
          Professores e alunos são responsáveis pelos textos, arquivos, imagens, vídeos, relatórios e informações que enviam ao app.
          O LuminaAI pode armazenar esses conteúdos para permitir histórico, acompanhamento pedagogico e funcionamento das funcionalidades contratadas.
        </p>

        <h2>8. Recursos de inteligência artificial</h2>
        <p>
          A IA pode auxiliar em relatórios, mensagens, análises de evolução e organização de rotina.
          As respostas podem conter erros ou interpretações incompletas, por isso o professor deve revisar qualquer conteúdo antes de usar, publicar ou enviar a alunos e responsáveis.
        </p>

        <h2>9. Assinatura, teste e pagamento</h2>
        <p>
          Professores novos podem ter período gratuito de teste. Após o teste, o acesso do professor pode depender do pagamento mensal informado na tela Financeiro.
          O valor atual da mensalidade do app e R$ 19,90, salvo promoção, isenção, ajuste futuro informado no app ou acordo especifico.
        </p>

        <h2>10. Cancelamento</h2>
        <p>
          Se a cobranca não for recorrente automática, o professor pode interromper a continuidade deixando de pagar o próximo período.
          Se futuramente houver assinatura recorrente, o app devera disponibilizar meio de cancelamento ou suporte para cancelamento.
          O período já pago permanece liberado até o fim da competência contratada, salvo estorno, fraude, contestação ou acordo de suporte.
        </p>

        <h2>11. Integracoes externas</h2>
        <p>
          Serviços como Supabase, Vercel, Mercado Pago, notificações do navegador, links de aula e eventuais integrações externas possuem políticas próprias.
          O LuminaAI usa integrações para executar ações solicitadas pelo usuário e pode depender da disponibilidade desses terceiros.
        </p>

        <h2>12. Disponibilidade</h2>
        <p>
          O app pode passar por manutenção, atualizações, alterações de layout e ajustes de funcionalidades.
          Não garantimos disponibilidade ininterrupta, especialmente quando a falha depender de internet, dispositivo, navegador, provedor de nuvem ou serviço externo.
        </p>

        <h2>13. Limitação de responsabilidade</h2>
        <p>
          O LuminaAI não se responsabiliza por decisões pedagógicas, cobranças feitas diretamente entre professor e aluno, dados incorretos cadastrados pelo usuário, perda decorrente de mau uso da conta ou conteúdo enviado sem autorização.
          Nada nestes Termos limita direitos que não possam ser limitados pela legislação aplicável.
        </p>

        <h2>14. Privacidade e LGPD</h2>
        <p>
          O tratamento de dados pessoais e descrito na Política de Privacidade.
          Usuarios podem solicitar acesso, correção, exclusão, portabilidade quando aplicável, revogação de consentimento e informações sobre compartilhamento pelo canal de suporte.
        </p>

        <h2>15. Suporte</h2>
        <p>
          Para dúvidas, suporte, cancelamento, reembolso, privacidade ou exercício de direitos relacionados a dados pessoais, entre em contato pelo WhatsApp: +1 (402) 366-7683.
        </p>

        <Link className="btn primary" href="/">Voltar ao inicio</Link>
      </section>
    </main>
  );
}
