const week = [
  { day: 'Seg', date: '22/06', lessons: [{ title: 'Portugues', time: '08:00', tone: 'blue' }] },
  { day: 'Ter', date: '23/06', lessons: [{ title: 'Ciencias', time: '10:00', tone: 'green' }] },
  { day: 'Qua', date: '24/06', lessons: [{ title: 'Matematica', time: '14:00', tone: 'active' }] },
  { day: 'Qui', date: '25/06', lessons: [{ title: 'Geografia', time: '16:00', tone: 'purple' }] },
  { day: 'Sex', date: '26/06', lessons: [{ title: 'Ingles', time: '16:00', tone: 'gold' }] },
];

const evolutionItems = [
  { title: 'Funcoes do 1 grau', status: 'Evolucao 88%', date: 'Ultimas 4 aulas' },
  { title: 'Interpretacao de problemas', status: 'Evolucao 76%', date: 'Ponto para reforcar' },
  { title: 'Autonomia nos exercicios', status: 'Evolucao 91%', date: 'Bom progresso' },
];

const nav = ['Inicio', 'Historico', 'Mensagens', 'Perfil'];

export default function DemoStudentPage() {
  return (
    <main className="demo-app-page demo-real-page demo-student-page">
      <aside className="demo-real-sidebar student">
        <div className="demo-real-brand">
          <div className="demo-logo">L</div>
          <div>
            <strong>LuminaAI</strong>
            <span>Portal do aluno</span>
          </div>
        </div>
        <nav>
          {nav.map((item) => <span className={item === 'Inicio' ? 'active' : ''} key={item}>{item}</span>)}
        </nav>
        <small>Ana Beatriz</small>
      </aside>

      <section className="demo-real-main">
        <header className="demo-real-topbar">
          <div>
            <span className="demo-eyebrow">Portal do Aluno</span>
            <h1>Ola, Ana Beatriz</h1>
          </div>
          <label>
            <span>Buscar</span>
            <input readOnly value="Buscar aulas, mensagens..." />
          </label>
          <div className="demo-user">Ana</div>
        </header>

        <section className="demo-student-dashboard">
          <div className="demo-student-main">
            <div className="demo-summary-row">
              <article>
                <span>Proxima aula</span>
                <strong>Matematica</strong>
                <p>Hoje, 14:00 com Prof. Camila</p>
              </article>
              <article>
                <span>Aulas registradas</span>
                <strong>8</strong>
                <p>Historico pronto para acompanhar sua evolucao.</p>
              </article>
              <article>
                <span>Seu progresso</span>
                <strong>84%</strong>
                <p>Evolucao positiva nas ultimas aulas.</p>
              </article>
            </div>

            <section className="demo-real-card">
              <div className="demo-section-head">
                <div>
                  <span className="demo-eyebrow">Semana de estudos</span>
                  <h2>Aulas dentro do inicio</h2>
                </div>
                <button>Hoje</button>
              </div>
              <div className="demo-week-board">
                {week.map((item) => (
                  <article className={item.lessons[0]?.tone || ''} key={item.day}>
                    <span>{item.day}</span>
                    <small>{item.date}</small>
                    {item.lessons.map((lesson) => (
                      <div key={lesson.title}>
                        <strong>{lesson.title}</strong>
                        <em>{lesson.time}</em>
                      </div>
                    ))}
                  </article>
                ))}
              </div>
            </section>

            <section className="demo-real-card">
              <div className="demo-section-head">
                <div>
                  <span className="demo-eyebrow">Evolucao</span>
                  <h2>Analise por aula</h2>
                </div>
                <button>Ver historico</button>
              </div>
              <div className="demo-student-activities">
                {evolutionItems.map((item) => (
                  <details key={item.title}>
                    <summary>
                      <strong>{item.title}</strong>
                      <span>{item.status}</span>
                    </summary>
                    <p>A IA cruza os relatorios das aulas para mostrar onde o aluno evoluiu e onde ainda precisa de atencao.</p>
                    <small>{item.date}</small>
                  </details>
                ))}
              </div>
            </section>
          </div>

          <aside className="demo-real-card demo-student-aside">
            <span className="demo-eyebrow">Aula de hoje</span>
            <div className="demo-student-focus">
              <span>AB</span>
              <div>
                <strong>Matematica</strong>
                <p>Prof. Camila Rocha</p>
              </div>
            </div>
            <p>Hoje, 14:00 - 14:50</p>
            <button className="demo-primary">Confirmar aula</button>
            <div className="demo-ai-card">
              <span>Evolucao por IA</span>
              <p>As duvidas sobre funcoes diminuiram nos ultimos relatorios.</p>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}

