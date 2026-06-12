import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="auth-shell">
      <section className="card stack" style={{ width: '100%', maxWidth: 520 }}>
        <h1>EduAssist Pro</h1>
        <p className="muted">Aplicativo proprio com Supabase, professor e aluno sincronizados pela mesma API.</p>
        <div className="row">
          <Link className="btn primary" href="/login">Entrar</Link>
          <Link className="btn" href="/register/teacher">Cadastrar professor</Link>
          <Link className="btn" href="/register/student">Cadastrar aluno</Link>
        </div>
      </section>
    </main>
  );
}
