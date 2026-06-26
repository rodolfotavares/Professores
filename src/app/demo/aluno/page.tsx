const week = [
  { day: 'Seg', date: '22/06', lessons: [{ title: 'Portugues', time: '08:00', tone: 'blue' }] },
  { day: 'Ter', date: '23/06', lessons: [{ title: 'Ciencias', time: '10:00', tone: 'green' }] },
  { day: 'Qua', date: '24/06', lessons: [{ title: 'Matematica', time: '14:00', tone: 'active' }] },
  { day: 'Qui', date: '25/06', lessons: [{ title: 'Geografia', time: '16:00', tone: 'purple' }] },
  { day: 'Sex', date: '26/06', lessons: [{ title: 'Ingles', time: '16:00', tone: 'gold' }] },
];

const activities = [
  { title: 'Resolver exercicios sobre funcoes', status: 'Pendente', date: 'Hoje, 18:00' },
  { title: 'Enviar resumo da aula', status: 'Em andamento', date: 'Amanha, 20:00' },
  { title: 'Revisao de grafico', status: 'Corrigida', date: 'Nota 9,0' },
];

const nav = ['Inicio', 'Atividades', 'Historico', 'Mensagens', 'Perfil'];

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
            <input readOnly value="Buscar aulas, atividades, mensagens..." />
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
                <span>Atividades pendentes</span>
                <strong>2</strong>
                <p>Toque para responder e anexar arquivos.</p>
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
                  <span className="demo-eyebrow">Atividades</span>
                  <h2>Responder tarefas</h2>
                </div>
                <button>Ver todas</button>
              </div>
              <div className="demo-student-activities">
                {activities.map((activity) => (
                  <details key={activity.title}>
                    <summary>
                      <strong>{activity.title}</strong>
                      <span>{activity.status}</span>
                    </summary>
                    <p>Campo de resposta, upload de arquivo e feedback ficam organizados dentro da atividade expandida.</p>
                    <small>{activity.date}</small>
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
