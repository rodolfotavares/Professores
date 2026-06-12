import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="auth-shell home-shell">
      <section className="card stack home-card" style={{ width: '100%', maxWidth: 560 }}>
        <span className="eyebrow">Professores e alunos</span>
        <h1>EduAssist Pro</h1>
        <p className="muted">Agenda, atividades, entregas, notas e recados sincronizados em um unico lugar.</p>
        <div className="row">
          <Link className="btn primary" href="/login">Entrar</Link>
          <Link className="btn accent" href="/register/teacher">Cadastrar professor</Link>
          <Link className="btn student" href="/register/student">Cadastrar aluno</Link>
        </div>
        <div className="feature-strip">
          <span>Agenda</span>
          <span>Atividades</span>
          <span>Recados</span>
        </div>
      </section>
    </main>
  );
}
