import Link from 'next/link';

const demoLinks = [
  {
    title: 'Demo do professor',
    description: 'Painel com agenda, alunos, atividades, financeiro e aula inteligente.',
    href: '/demo/professor',
    url: 'https://professores-nine.vercel.app/demo/professor',
  },
  {
    title: 'Demo do aluno',
    description: 'Portal do aluno com inicio, atividades, progresso e mensagens.',
    href: '/demo/aluno',
    url: 'https://professores-nine.vercel.app/demo/aluno',
  },
];

export default function DemoHubPage() {
  return (
    <main className="demo-hub-page">
      <section className="demo-hub-card">
        <span className="demo-eyebrow">LuminaAI Demo</span>
        <h1>Ambiente publico para gravar anuncios</h1>
        <p>Use estes links atualizados para abrir os dois portais sem login, com dados ficticios e visual preparado para demonstracao.</p>
        <div className="demo-hub-actions">
          {demoLinks.map((link) => (
            <Link href={link.href} key={link.href}>{link.title}</Link>
          ))}
        </div>
        <div className="demo-link-list">
          {demoLinks.map((link) => (
            <article key={link.url}>
              <strong>{link.title}</strong>
              <span>{link.description}</span>
              <a href={link.url}>{link.url}</a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
