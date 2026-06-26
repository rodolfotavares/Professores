import Link from 'next/link';

export default function DemoHubPage() {
  return (
    <main className="demo-hub-page">
      <section className="demo-hub-card">
        <span className="demo-eyebrow">LuminaAI Demo</span>
        <h1>Ambiente publico para gravar anuncios</h1>
        <p>Use estes links para abrir os dois portais sem login, com dados ficticios e visual preparado para demonstracao.</p>
        <div className="demo-hub-actions">
          <Link href="/demo/professor">Abrir portal do professor</Link>
          <Link href="/demo/aluno">Abrir portal do aluno</Link>
        </div>
      </section>
    </main>
  );
}
