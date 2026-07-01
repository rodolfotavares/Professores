const students = [
  { name: 'Ana Beatriz', subject: 'Matemática', next: 'Hoje, 14:00', status: 'Em dia', progress: 85, tone: 'green' },
  { name: 'Lucas Almeida', subject: 'Física', next: 'Amanha, 16:30', status: 'Atenção', progress: 58, tone: 'orange' },
  { name: 'Sofia Ribeiro', subject: 'Redação', next: 'Sexta, 18:00', status: 'Em dia', progress: 92, tone: 'green' },
  { name: 'Caio Henrique', subject: 'Quimica', next: 'Segunda, 10:00', status: 'Em dia', progress: 76, tone: 'blue' },
];

const reports = [
  { title: 'Aula de funções', student: 'Ana Beatriz', status: 'Relatório pronto', progress: 'Evolução 88%' },
  { title: 'Revisão de fisica', student: 'Lucas Almeida', status: 'Ponto de atenção', progress: 'Evolução 62%' },
  { title: 'Redação orientada', student: 'Sofia Ribeiro', status: 'Bom progresso', progress: 'Evolução 91%' },
];

const nav = ['Início', 'Alunos', 'Aula Inteligente', 'Mensagens', 'Financeiro', 'Suporte'];

export default function DemoTeacherPage() {
  return (
    <main className="demo-app-page demo-real-page">
      <aside className="demo-real-sidebar">
        <div className="demo-real-brand">
          <div className="demo-logo">L</div>
          <div>
            <strong>LuminaAI</strong>
            <span>Portal do professor</span>
          </div>
        </div>
        <nav>
          {nav.map((item) => <span className={item === 'Início' ? 'active' : ''} key={item}>{item}</span>)}
        </nav>
        <small>Prof. Camila Rocha</small>
      </aside>

      <section className="demo-real-main">
        <header className="demo-real-topbar">
          <div>
            <span className="demo-eyebrow">Portal do Professor</span>
            <h1>Painel</h1>
          </div>
          <label>
            <span>Buscar</span>
            <input readOnly value="Buscar alunos, aulas, mensagens..." />
          </label>
          <div className="demo-user">Prof. Camila</div>
        </header>

        <section className="demo-real-grid">
          <article className="demo-real-card demo-span-2">
            <div className="demo-section-head">
              <div>
                <span className="demo-eyebrow">Agenda da semana</span>
                <h2>Aulas de hoje</h2>
              </div>
              <button>Nova aula</button>
            </div>
            <div className="demo-class-list">
              {students.slice(0, 3).map((student) => (
                <div key={student.name}>
                  <span className={student.tone}>{student.name.slice(0, 2)}</span>
                  <div>
                    <strong>{student.name}</strong>
                    <small>{student.subject} - {student.next}</small>
                  </div>
                  <em>{student.status}</em>
                </div>
              ))}
            </div>
          </article>

          <aside className="demo-real-card demo-focus-card">
            <span className="demo-eyebrow">Próxima aula</span>
            <div className="demo-student-focus">
              <span>AB</span>
              <div>
                <strong>Ana Beatriz</strong>
                <p>Matemática - funções</p>
              </div>
            </div>
            <button className="demo-primary">Iniciar aula</button>
            <button>Gerar relatório inteligente</button>
          </aside>

          <article className="demo-real-card demo-span-2">
            <div className="demo-section-head">
              <div>
                <span className="demo-eyebrow">Alunos</span>
                <h2>Acompanhamento</h2>
              </div>
              <button>Novo aluno</button>
            </div>
            <div className="demo-student-cards">
              {students.map((student) => (
                <article key={student.name}>
                  <div className="demo-card-headline">
                    <span className={student.tone}>{student.name.slice(0, 2)}</span>
                    <div>
                      <strong>{student.name}</strong>
                      <small>{student.subject}</small>
                    </div>
                  </div>
                  <p>Próxima aula: {student.next}</p>
                  <div className="demo-progress"><span style={{ width: `${student.progress}%` }} /></div>
                </article>
              ))}
            </div>
          </article>

          <article className="demo-real-card">
            <span className="demo-eyebrow">Financeiro</span>
            <h2>R$ 4.280,00</h2>
            <p>Recebido no mes</p>
            <div className="demo-money-row"><span>A receber</span><strong>R$ 1.150,00</strong></div>
            <div className="demo-money-row danger"><span>Em atraso</span><strong>R$ 240,00</strong></div>
          </article>

          <article className="demo-real-card demo-span-3">
            <div className="demo-section-head">
              <div>
                <span className="demo-eyebrow">Aula Inteligente</span>
                <h2>Relatórios recentes</h2>
              </div>
              <button>Novo relatório</button>
            </div>
            <div className="demo-activity-table">
              {reports.map((report) => (
                <div key={report.title}>
                  <strong>{report.title}</strong>
                  <span>{report.student}</span>
                  <em>{report.status}</em>
                  <small>{report.progress}</small>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

