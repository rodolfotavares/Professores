import Link from 'next/link';

const benefits = [
  {
    title: 'Alunos e agenda em ordem',
    text: 'Cadastre alunos, dias de aula, horários e valores sem planilhas soltas.',
  },
  {
    title: 'Atividades com entrega',
    text: 'Envie tarefas, receba respostas com arquivos e corrija em um só fluxo.',
  },
  {
    title: 'Cobrança mais clara',
    text: 'Acompanhe previsão mensal, alunos ativos e pagamentos de forma simples.',
  },
];

const steps = [
  'Cadastre seus alunos e horários.',
  'Publique atividades e acompanhe entregas.',
  'Use mensagens, agenda e financeiro no dia a dia.',
];

export default function HomePage() {
  return (
    <main className="marketing-page">
      <section className="marketing-hero">
        <div className="hero-copy">
          <span className="eyebrow">Gestão premium para professores particulares</span>
          <h1>LuminaAI</h1>
          <p>Organize aulas particulares com aparência profissional: alunos, agenda, atividades, mensagens e financeiro em um portal simples para professor e aluno.</p>
          <div className="row hero-actions">
            <Link className="btn accent" href="/register/teacher">Começar agora</Link>
            <Link className="btn primary" href="/login">Entrar</Link>
            <Link className="btn ghost" href="/register/student">Sou aluno</Link>
          </div>
          <div className="trust-strip">
            <span>Feito para aulas particulares</span>
            <span>App instalável no celular</span>
            <span>R$ 39,90/mês</span>
          </div>
          <div className="legal-links">
            <Link href="/privacy">Privacidade</Link>
            <Link href="/terms">Termos</Link>
          </div>
        </div>

        <div className="product-preview" aria-label="Prévia visual do painel LuminaAI">
          <div className="preview-topbar">
            <span />
            <strong>Painel do professor</strong>
            <small>premium</small>
          </div>
          <div className="preview-grid">
            <div className="preview-stat">
              <small>Agenda</small>
              <strong>Organizada</strong>
            </div>
            <div className="preview-stat">
              <small>Atividades</small>
              <strong>Controladas</strong>
            </div>
            <div className="preview-card wide">
              <div className="mini-bar one" />
              <div className="mini-bar two" />
              <div className="mini-bar three" />
            </div>
            <div className="preview-card">
              <span className="mini-dot" />
              <p>Aula confirmada</p>
            </div>
            <div className="preview-card">
              <span className="mini-dot gold" />
              <p>Tarefa entregue</p>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-section">
        <div className="section-heading">
          <span className="eyebrow">Por que usar</span>
          <h2>Menos bagunça. Mais controle. Mais profissionalismo.</h2>
        </div>
        <div className="marketing-card-grid">
          {benefits.map((benefit) => (
            <article className="marketing-card" key={benefit.title}>
              <strong>{benefit.title}</strong>
              <p>{benefit.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section marketing-split">
        <div className="pricing-panel">
          <span className="eyebrow">Plano do professor</span>
          <h2>R$ 39,90</h2>
          <p>por mês. Os alunos não pagam assinatura para acessar o portal.</p>
          <Link className="btn accent" href="/register/teacher">Criar conta de professor</Link>
        </div>
        <div className="how-it-works">
          <span className="eyebrow">Como funciona</span>
          <ol>
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
