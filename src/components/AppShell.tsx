'use client';

import { usePathname } from 'next/navigation';

const titles: Record<string, { title: string; eyebrow: string }> = {
  '/teacher': { title: 'Dashboard', eyebrow: 'Portal do Professor' },
  '/teacher/classes': { title: 'Turmas', eyebrow: 'Organizacao' },
  '/teacher/students': { title: 'Alunos', eyebrow: 'Administracao' },
  '/teacher/activities': { title: 'Atividades', eyebrow: 'Tarefas' },
  '/teacher/grades': { title: 'Notas', eyebrow: 'Avaliacao' },
  '/teacher/frequency': { title: 'Frequencia', eyebrow: 'Presenca' },
  '/teacher/schedule': { title: 'Agenda', eyebrow: 'Calendario' },
  '/teacher/finance': { title: 'Relatorios', eyebrow: 'Resultados' },
  '/teacher/messages': { title: 'Mensagens', eyebrow: 'Comunicacao' },
  '/teacher/settings': { title: 'Configuracoes', eyebrow: 'Conta' },
  '/teacher/planner': { title: 'Planos de aula', eyebrow: 'Planejamento' },
  '/teacher/news': { title: 'Noticias', eyebrow: 'Curadoria' },
  '/student': { title: 'Dashboard', eyebrow: 'Portal do Aluno' },
  '/student/classes': { title: 'Minhas aulas', eyebrow: 'Aulas' },
  '/student/activities': { title: 'Atividades', eyebrow: 'Tarefas' },
  '/student/grades': { title: 'Notas', eyebrow: 'Desempenho' },
  '/student/frequency': { title: 'Frequencia', eyebrow: 'Presenca' },
  '/student/schedule': { title: 'Calendario', eyebrow: 'Agenda' },
  '/student/messages': { title: 'Mensagens', eyebrow: 'Comunicacao' },
  '/student/materials': { title: 'Materiais', eyebrow: 'Arquivos' },
  '/student/settings': { title: 'Perfil', eyebrow: 'Configuracoes' },
};

export function AppLayout({ children, area }: { children: React.ReactNode; area: 'teacher' | 'student' }) {
  const pathname = usePathname();
  const current = titles[pathname] || { title: area === 'teacher' ? 'Portal do Professor' : 'Portal do Aluno', eyebrow: 'EduAssist Pro' };

  return (
    <section className="app-glass-shell">
      <header className="app-top-header">
        <div>
          <span className="eyebrow">{current.eyebrow}</span>
          <h1>{current.title}</h1>
        </div>
        <div className="app-header-actions">
          <button className="glass-icon-button" title="Notificacoes" aria-label="Notificacoes">o</button>
          <div className="teacher-avatar">{area === 'teacher' ? 'P' : 'A'}</div>
        </div>
      </header>
      <div className="app-content">
        {children}
      </div>
    </section>
  );
}

export function GlobalBackground() {
  return (
    <div className="global-background" aria-hidden="true">
      <div className="global-background-image" />
      <div className="global-background-overlay" />
      <div className="global-background-light light-blue" />
      <div className="global-background-light light-cyan" />
      <div className="global-background-light light-violet" />
    </div>
  );
}

export function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`card glass-card ${className}`}>{children}</section>;
}

export function MetricCard({ title, value, note }: { title: string; value: string | number; note?: string }) {
  return (
    <GlassCard className="metric-card">
      <p className="muted">{title}</p>
      <h2>{value}</h2>
      {note && <small>{note}</small>}
    </GlassCard>
  );
}

export function StatusBadge({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'warning' | 'success' }) {
  return <span className={`badge status-${tone}`}>{children}</span>;
}

export function DataTable({ rows }: { rows: Array<{ title: string; meta?: string; value?: string | number; status?: string }> }) {
  return (
    <GlassCard className="data-table-card">
      <div className="data-table">
        {rows.map((row) => (
          <div className="data-row" key={`${row.title}-${row.meta || row.value || row.status}`}>
            <span>
              <strong>{row.title}</strong>
              {row.meta && <small>{row.meta}</small>}
            </span>
            {row.value != null && <span>{row.value}</span>}
            {row.status && <StatusBadge tone="default">{row.status}</StatusBadge>}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
