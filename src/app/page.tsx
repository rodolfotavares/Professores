import Link from 'next/link';

const calendarItems = [
  { day: 6, title: 'InglÃªs', time: '09:00', tone: 'green' },
  { day: 7, title: 'MatemÃ¡tica', time: '14:00', tone: 'purple' },
  { day: 8, title: 'FÃ­sica', time: '10:30', tone: 'yellow' },
  { day: 9, title: 'RedaÃ§Ã£o', time: '16:00', tone: 'blue' },
  { day: 13, title: 'InglÃªs', time: '09:00', tone: 'green' },
  { day: 14, title: 'MatemÃ¡tica', time: '14:00', tone: 'purple' },
  { day: 15, title: 'FÃ­sica', time: '10:30', tone: 'yellow' },
  { day: 16, title: 'RedaÃ§Ã£o', time: '16:00', tone: 'blue' },
  { day: 20, title: 'InglÃªs', time: '09:00', tone: 'green' },
  { day: 21, title: 'MatemÃ¡tica', time: '14:00', tone: 'purple active' },
  { day: 22, title: 'FÃ­sica', time: '10:30', tone: 'yellow' },
  { day: 23, title: 'RedaÃ§Ã£o', time: '16:00', tone: 'blue' },
  { day: 27, title: 'InglÃªs', time: '09:00', tone: 'green' },
  { day: 28, title: 'MatemÃ¡tica', time: '14:00', tone: 'purple' },
];

const benefits = [
  ['Agenda inteligente', 'Organize aulas e receba lembretes automÃ¡ticos.', 'calendar'],
  ['Aulas conectadas', 'Organize aulas e acompanhe a evolucao em poucos cliques.', 'tasks'],
  ['Financeiro simples', 'Controle pagamentos e acompanhe recebimentos com facilidade.', 'money'],
];

export default function HomePage() {
  return (
    <main className="flow-landing">
      <header className="flow-header">
        <Link className="flow-logo" href="/">
          <span><CalendarLogo /></span>
          <strong>LuminaAI</strong>
        </Link>
        <nav>
          <Link href="/login">JÃ¡ tenho uma conta</Link>
          <Link className="flow-login-button" href="/login">Entrar</Link>
        </nav>
      </header>

      <section className="flow-hero">
        <div className="flow-copy">
          <h1>Sua rotina de aulas, mais simples.</h1>
          <p>Organize agenda, alunos, aulas e pagamentos em um sÃ³ lugar.</p>

          <div className="flow-role-grid">
            <Link className="flow-role-card" href="/register/teacher">
              <TeacherCardIcon />
              <strong>Sou professor</strong>
              <span>Gerencie seus alunos e aulas com facilidade.</span>
              <em>â†’</em>
            </Link>
            <Link className="flow-role-card" href="/register/student">
              <StudentCardIcon />
              <strong>Sou aluno</strong>
              <span>Acompanhe suas aulas e evolucao.</span>
              <em>â†’</em>
            </Link>
          </div>

          <Link className="flow-create-link" href="/register/teacher">Criar conta gratuita <span>â€º</span></Link>
        </div>

        <div className="flow-preview" aria-label="PrÃ©via do painel LuminaAI">
          <aside className="flow-preview-sidebar">
            <div className="flow-preview-brand"><CalendarLogo /> <strong>LuminaAI</strong></div>
            {['Agenda', 'Alunos', 'Aula Inteligente', 'Financeiro', 'Mensagens', 'RelatÃ³rios', 'ConfiguraÃ§Ãµes'].map((item, index) => (
              <span className={index === 0 ? 'active' : ''} key={item}><PreviewIcon /> {item}</span>
            ))}
            <small>Ajuda</small>
          </aside>

          <section className="flow-calendar">
            <div className="flow-calendar-head">
              <h2>Maio de 2025</h2>
              <div>
                <button>â€¹</button>
                <button>â€º</button>
                <button>Hoje</button>
              </div>
              <button>MÃªsâŒ„</button>
            </div>
            <div className="flow-weekdays">
              {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÃB'].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="flow-calendar-grid">
              {Array.from({ length: 35 }).map((_, index) => {
                const day = index < 4 ? 27 + index : index - 3;
                const item = calendarItems.find((entry) => entry.day === day);
                return (
                  <div className={day === 21 ? 'selected' : ''} key={`${day}-${index}`}>
                    <span>{day}</span>
                    {item && <small className={item.tone}>{item.title}<br />{item.time}</small>}
                  </div>
                );
              })}
            </div>
            <div className="flow-legend">
              {['InglÃªs', 'MatemÃ¡tica', 'FÃ­sica', 'RedaÃ§Ã£o'].map((item) => <span key={item}>{item}</span>)}
            </div>
          </section>

          <aside className="flow-preview-rail">
            <div className="flow-date-card">
              <strong>Quarta-feira, 21 de maio</strong>
              <div>
                <b>MatemÃ¡tica</b>
                <span>14:00 - 15:00</span>
                <small>Aula particular</small>
              </div>
            </div>
            <div className="flow-student-card">
              <span>AC</span>
              <strong>Ana Clara Souza</strong>
              <small>9Âº ano - Ensino Fundamental</small>
              <button>Ver perfil do aluno</button>
            </div>
            <div className="flow-small-card">
              <strong>Proximo relatorio</strong>
              <span>Lista de exercÃ­cios - FunÃ§Ãµes</span>
            </div>
            <div className="flow-small-card">
              <strong>Pagamento</strong>
              <b>R$ 180,00</b>
              <small>Em dia</small>
            </div>
            <button className="flow-class-button">Confirmar aula</button>
          </aside>
        </div>
      </section>

      <section className="flow-benefits">
        {benefits.map(([title, text, icon]) => (
          <article key={title}>
            <BenefitIcon name={icon} />
            <div>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function CalendarLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18M7 15h10" />
    </svg>
  );
}

function TeacherCardIcon() {
  return <CalendarLogo />;
}

function StudentCardIcon() {
  return (
    <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H20v17H7.5A3.5 3.5 0 0 0 4 22V5.5Z" />
      <path d="M8 6h8M8 10h7M8 14h5" />
      <path d="m15 15 1.5 1.5L20 13" />
    </svg>
  );
}

function PreviewIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="3" /></svg>;
}

function BenefitIcon({ name }: { name: string }) {
  if (name === 'money') return <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 6v12M16 9.5A3 3 0 0 0 12.5 8H11a2.5 2.5 0 0 0 0 5h2a2.5 2.5 0 0 1 0 5h-1.5A3 3 0 0 1 8 16.5" /></svg>;
  if (name === 'tasks') return <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>;
  return <CalendarLogo />;
}

