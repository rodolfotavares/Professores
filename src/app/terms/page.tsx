import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="marketing-page legal-page">
      <section className="card legal-card stack">
        <span className="eyebrow">LuminaAI</span>
        <h1>Termos de Uso</h1>
        <p className="muted">Última atualização: 7 de julho de 2026.</p>

        <h2>1. Aceite dos termos</h2>
        <p>
          Ao criar conta, acessar ou usar o LuminaAI, o usuário declara que leu e concorda com estes Termos de Uso e com a Política de Privacidade.
          Caso não concorde, deve interromper o uso do app.
        </p>

        <h2>2. O que é o LuminaAI</h2>
        <p>
          O LuminaAI é uma plataforma para professores particulares organizarem alunos, agenda, relatórios de aula, mensagens, arquivos, evolução pedagógica e controle financeiro.
          O app não substitui a atuação pedagógica, profissional, contábil, jurídica ou administrativa do professor.
        </p>

        <h2>3. Contas de professor e aluno</h2>
        <p>
          O professor é responsável por manter seus dados atualizados, proteger sua senha e cadastrar alunos apenas quando tiver autorização adequada do aluno, dos pais ou do responsável legal, quando aplicável.
          O aluno deve usar o portal apenas para acompanhar informações relacionadas às próprias aulas.
        </p>

        <h2>4. Dados de alunos, responsáveis e menores de idade</h2>
        <p>
          O professor declara que possui base legal, autorização ou relação legítima para cadastrar dados de alunos e responsáveis no app.
          Quando houver dados de crianças ou adolescentes, o professor deve obter autorização do responsável legal e usar somente as informações necessárias para organizar as aulas.
        </p>

        <h2>5. Uso correto da plataforma</h2>
        <p>
          É proibido usar o LuminaAI para conteúdo ilícito, discriminatório, ofensivo, invasivo, publicitário não solicitado, violação de privacidade, compartilhamento indevido de dados ou qualquer finalidade fora da rotina educacional proposta pelo app.
        </p>

        <h2>6. Mensagens, arquivos e relatórios</h2>
        <p>
          O professor e o aluno são responsáveis pelos textos, arquivos, imagens, vídeos e informações enviados ao app.
          O LuminaAI pode armazenar esses conteúdos para permitir histórico, acompanhamento pedagógico e funcionamento das funcionalidades contratadas.
        </p>

        <h2>7. Recursos de inteligência artificial</h2>
        <p>
          Recursos de IA podem auxiliar na organização de relatórios, identificação de padrões de dúvidas e geração de sugestões.
          As respostas podem conter erros ou interpretações incompletas, por isso o professor deve revisar qualquer conteúdo antes de usar, publicar ou enviar a alunos e responsáveis.
        </p>

        <h2>8. Assinatura, pagamento e acesso</h2>
        <p>
          Professores novos podem ter período gratuito de teste. Após o teste, o uso do portal do professor pode depender do pagamento mensal informado na tela Financeiro.
          O pagamento atual é mensal e não representa cobrança recorrente automática no cartão: o professor gera o pagamento do mês quando desejar continuar usando o app.
        </p>

        <h2>9. Cancelamento após pagamento</h2>
        <p>
          Como a cobrança atual não é recorrente automática, o professor pode cancelar a continuidade simplesmente deixando de pagar o próximo mês.
          O mês já pago permanece liberado até o fim do período contratado, salvo falha, estorno, contestação ou acordo específico de suporte.
          Solicitações de arrependimento, reembolso, correção de cobrança ou encerramento de conta devem ser enviadas ao suporte.
        </p>

        <h2>10. Integrações externas</h2>
        <p>
          Integrações como Mercado Pago, Google Agenda, notificações do navegador e outros serviços externos dependem de plataformas de terceiros.
          O LuminaAI usa essas integrações apenas para executar ações solicitadas pelo usuário, como pagamento, sincronização de agenda ou envio de lembretes.
        </p>

        <h2>11. Disponibilidade e alterações</h2>
        <p>
          O app pode passar por manutenção, atualizações, mudanças de layout e ajustes de funcionalidades.
          O LuminaAI não garante disponibilidade ininterrupta, principalmente quando a falha depender de internet, navegador, dispositivo, Supabase, Vercel, Mercado Pago, Google ou outro serviço externo.
        </p>

        <h2>12. Limitação de responsabilidade</h2>
        <p>
          O LuminaAI não se responsabiliza por decisões pedagógicas, cobranças feitas diretamente entre professor e aluno, dados cadastrados incorretamente pelo usuário, perda decorrente de mau uso da conta ou conteúdo enviado sem autorização.
          Nada nestes termos limita direitos que não possam ser limitados pela legislação aplicável.
        </p>

        <h2>13. Privacidade e LGPD</h2>
        <p>
          O tratamento de dados pessoais é descrito na Política de Privacidade. O usuário pode solicitar acesso, correção, exclusão, portabilidade quando aplicável, revogação de consentimento e informações sobre compartilhamento de dados pelo canal de suporte.
        </p>

        <h2>14. Suporte</h2>
        <p>
          Para dúvidas, suporte, cancelamento, reembolso, solicitações de privacidade ou exercício de direitos relacionados a dados pessoais, entre em contato pelo WhatsApp: +1 (402) 366-7683.
        </p>

        <Link className="btn primary" href="/">Voltar ao início</Link>
      </section>
    </main>
  );
}
