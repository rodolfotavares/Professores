import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="marketing-page">
      <section className="marketing-hero">
        <div className="hero-copy">
          <span className="eyebrow">Gestao para aulas particulares</span>
          <h1>Lumina</h1>
          <p>Um portal elegante para organizar alunos, agenda, tarefas, pagamentos previstos e comunicacao em um so lugar.</p>
          <div className="row hero-actions">
            <Link className="btn primary" href="/login">Entrar</Link>
            <Link className="btn accent" href="/register/teacher">Comecar como professor</Link>
            <Link className="btn ghost" href="/register/student">Sou aluno</Link>
          </div>
          <div className="trust-strip">
            <span>Agenda sincronizada</span>
            <span>Entregas com arquivo</span>
            <span>Previsao financeira</span>
          </div>
        </div>
        <div className="product-preview" aria-label="Previa visual do painel Lumina">
          <div className="preview-topbar">
            <span />
            <strong>Painel do professor</strong>
            <small>online</small>
          </div>
          <div className="preview-grid">
            <div className="preview-stat">
              <small>Ganhos previstos</small>
              <strong>R$ 4.820</strong>
            </div>
            <div className="preview-stat">
              <small>Atividades</small>
              <strong>18</strong>
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
    </main>
  );
}
