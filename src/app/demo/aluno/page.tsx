const week = [
  { day: 'Seg', date: '22/06', lessons: [{ title: 'Portugues', time: '08:00', tone: 'blue' }] },
  { day: 'Ter', date: '23/06', lessons: [{ title: 'Ciencias', time: '10:00', tone: 'green' }] },
  { day: 'Qua', date: '24/06', lessons: [{ title: 'Matemática', time: '14:00', tone: 'active' }] },
  { day: 'Qui', date: '25/06', lessons: [{ title: 'Geografia', time: '16:00', tone: 'purple' }] },
  { day: 'Sex', date: '26/06', lessons: [{ title: 'Ingles', time: '16:00', tone: 'gold' }] },
];

const evolutionItems = [
  { title: 'Funcoes do 1 grau', status: 'Evolução 88%', date: 'Últimas 4 aulas' },
  { title: 'Interpretacao de problemas', status: 'Evolução 76%', date: 'Ponto para reforçar' },
  { title: 'Autonomia nos exercicios', status: 'Evolução 91%', date: 'Bom progresso' },
];

const nav = ['Início', 'Histórico', 'Mensagens', 'Perfil'];

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
          {nav.map((item) => <span className={item === 'Início' ? 'active' : ''} key={item}>{item}</span>)}
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
                <span>Próxima aula</span>
                <strong>Matemática</strong>
                <p>Hoje, 14:00 com Prof. Camila</p>
              </article>
              <article>
                <span>Aulas registradas</span>
                <strong>8</strong>
                <p>Histórico pronto para acompanhar sua evolução.</p>
              </article>
              <article>
                <span>Seu progresso</span>
                <strong>84%</strong>
                <p>Evolução positiva nas últimas aulas.</p>
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
                  <span className="demo-eyebrow">Evolução</span>
                  <h2>Análise por aula</h2>
                </div>
                <button>Ver histórico</button>
              </div>
              <div className="demo-student-activities">
                {evolutionItems.map((item) => (
                  <details key={item.title}>
                    <summary>
                      <strong>{item.title}</strong>
                      <span>{item.status}</span>
                    </summary>
                    <p>A IA cruza os relatórios das aulas para mostrar onde o aluno evoluiu e onde ainda precisa de atenção.</p>
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
                <strong>Matemática</strong>
                <p>Prof. Camila Rocha</p>
              </div>
            </div>
            <p>Hoje, 14:00 - 14:50</p>
            <button className="demo-primary">Confirmar aula</button>
            <div className="demo-ai-card">
              <span>Evolução por IA</span>
              <p>As dúvidas sobre funções diminuiram nos ultimos relatórios.</p>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}

