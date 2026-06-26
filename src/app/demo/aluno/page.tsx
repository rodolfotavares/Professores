const lessons = [
  { day: 'Seg', title: 'Portugues', time: '08:00', tone: 'blue' },
  { day: 'Ter', title: 'Ciencias', time: '10:00', tone: 'green' },
  { day: 'Qua', title: 'Matematica', time: '14:00', tone: 'active' },
  { day: 'Sex', title: 'Ingles', time: '16:00', tone: 'gold' },
];

const scores = [52, 58, 63, 71, 78, 84];

export default function DemoStudentPage() {
  return (
    <main className="demo-app-page demo-student-page">
      <aside className="demo-sidebar light">
        <div className="demo-logo">L</div>
        <nav>
          <span className="active">Inicio</span>
          <span>Minha agenda</span>
          <span>Atividades</span>
          <span>Historico</span>
          <span>Mensagens</span>
        </nav>
        <small>Ana Beatriz</small>
      </aside>
      <section className="demo-main-panel">
        <header className="demo-student-hero">
          <div>
            <span className="demo-eyebrow">Portal do aluno</span>
            <h1>Ola, Ana Beatriz</h1>
            <p>Sua semana de estudos organizada em um so lugar.</p>
          </div>
          <article>
            <strong>Proxima aula</strong>
            <span>Hoje, 14:00</span>
            <p>Matematica com Prof. Camila Rocha</p>
          </article>
        </header>
        <div className="demo-student-grid">
          <section className="demo-student-calendar">
            <h2>Esta semana</h2>
            <div className="demo-lessons-grid">
              {lessons.map((lesson) => (
                <article className={lesson.tone} key={lesson.day}>
                  <span>{lesson.day}</span>
                  <strong>{lesson.title}</strong>
                  <small>{lesson.time}</small>
                </article>
              ))}
            </div>
          </section>
          <aside className="demo-right-panel student">
            <h2>Para hoje</h2>
            <label><input type="checkbox" readOnly /> Resolver exercicios sobre funcoes</label>
            <label><input type="checkbox" readOnly /> Revisar grafico da aula</label>
            <button className="demo-primary">Entrar na aula</button>
          </aside>
        </div>
        <section className="demo-evolution-public">
          <div>
            <span className="demo-eyebrow">Evolucao por IA</span>
            <h2>84%</h2>
            <p>A pontuacao subiu porque duvidas anteriores deixaram de aparecer nos relatorios recentes.</p>
          </div>
          <svg viewBox="0 0 100 42" preserveAspectRatio="none" aria-label="Grafico de evolucao">
            <path d="M0 34 L20 29 L40 24 L60 17 L80 12 L100 7" />
            {scores.map((score, index) => (
              <circle key={score} cx={index * 20} cy={42 - (score / 100) * 42} r="2" />
            ))}
          </svg>
        </section>
      </section>
    </main>
  );
}
