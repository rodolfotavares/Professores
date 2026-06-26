const students = [
  { name: 'Ana Beatriz', subject: 'Matematica', time: '14:00', status: 'Confirmada', color: 'green' },
  { name: 'Lucas Almeida', subject: 'Fisica', time: '16:30', status: 'Atenção', color: 'orange' },
  { name: 'Sofia Ribeiro', subject: 'Redacao', time: '18:00', status: 'Confirmada', color: 'blue' },
];

const days = Array.from({ length: 35 }, (_, index) => index + 1);

export default function DemoTeacherPage() {
  return (
    <main className="demo-app-page">
      <aside className="demo-sidebar">
        <div className="demo-logo">L</div>
        <nav>
          <span className="active">Inicio</span>
          <span>Agenda</span>
          <span>Alunos</span>
          <span>Atividades</span>
          <span>Aula Inteligente</span>
          <span>Financeiro</span>
        </nav>
        <small>Prof. Camila Rocha</small>
      </aside>
      <section className="demo-main-panel">
        <header className="demo-topbar">
          <label>
            <span>Buscar</span>
            <input readOnly value="Buscar alunos, aulas, atividades..." />
          </label>
          <div className="demo-user">Prof. Camila</div>
        </header>
        <div className="demo-teacher-grid">
          <section className="demo-calendar">
            <div className="demo-section-head">
              <div>
                <span className="demo-eyebrow">Agenda inteligente</span>
                <h1>Junho 2026</h1>
              </div>
              <button>Hoje</button>
            </div>
            <div className="demo-weekdays">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="demo-month-grid">
              {days.map((day) => (
                <div className={day === 17 ? 'selected' : ''} key={day}>
                  <strong>{day}</strong>
                  {day === 9 && <small className="green">Ana - 14:00</small>}
                  {day === 11 && <small className="orange">Lucas - 16:30</small>}
                  {day === 17 && <small className="blue">Sofia - 18:00</small>}
                  {day === 23 && <small className="green">Ana - 14:00</small>}
                </div>
              ))}
            </div>
          </section>
          <aside className="demo-right-panel">
            <h2>Aula de hoje</h2>
            <div className="demo-student-focus">
              <span>AB</span>
              <div>
                <strong>Ana Beatriz</strong>
                <p>Matematica - funcoes</p>
              </div>
            </div>
            <button className="demo-primary">Iniciar aula</button>
            <button>Gerar relatorio inteligente</button>
            <div className="demo-ai-card">
              <span>IA pedagogica</span>
              <p>Dificuldades recorrentes detectadas e mensagem pronta para o responsavel.</p>
            </div>
          </aside>
        </div>
        <section className="demo-card-row">
          {students.map((student) => (
            <article className="demo-mini-card" key={student.name}>
              <span className={student.color}>{student.status}</span>
              <h3>{student.name}</h3>
              <p>{student.subject} hoje as {student.time}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
