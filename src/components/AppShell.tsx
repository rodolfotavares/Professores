'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/fetcher';

const titles: Record<string, { title: string; eyebrow: string }> = {
  '/teacher': { title: 'Painel', eyebrow: 'Portal do Professor' },
  '/teacher/classes': { title: 'Turmas', eyebrow: 'Organização' },
  '/teacher/students': { title: 'Alunos', eyebrow: 'Administração' },
  '/teacher/activities': { title: 'Atividades', eyebrow: 'Tarefas' },
  '/teacher/grades': { title: 'Notas', eyebrow: 'Avaliação' },
  '/teacher/frequency': { title: 'Frequência', eyebrow: 'Presença' },
  '/teacher/schedule': { title: 'Agenda', eyebrow: 'Calendário' },
  '/teacher/finance': { title: 'Relatórios', eyebrow: 'Resultados' },
  '/teacher/messages': { title: 'Mensagens', eyebrow: 'Comunicação' },
  '/teacher/settings': { title: 'Configurações', eyebrow: 'Conta' },
  '/teacher/planner': { title: 'Planos de aula', eyebrow: 'Planejamento' },
  '/teacher/news': { title: 'Notícias', eyebrow: 'Curadoria' },
  '/teacher/tutorial': { title: 'Tutorial', eyebrow: 'Instalação' },
  '/student': { title: 'Painel', eyebrow: 'Portal do Aluno' },
  '/student/classes': { title: 'Minhas aulas', eyebrow: 'Aulas' },
  '/student/activities': { title: 'Atividades', eyebrow: 'Tarefas' },
  '/student/grades': { title: 'Notas', eyebrow: 'Desempenho' },
  '/student/frequency': { title: 'Frequência', eyebrow: 'Presença' },
  '/student/schedule': { title: 'Agenda', eyebrow: 'Calendário' },
  '/student/messages': { title: 'Mensagens', eyebrow: 'Comunicação' },
  '/student/materials': { title: 'Materiais', eyebrow: 'Arquivos' },
  '/student/settings': { title: 'Perfil', eyebrow: 'Configurações' },
  '/student/tutorial': { title: 'Tutorial', eyebrow: 'Instalação' },
};

export function AppLayout({ children, area }: { children: React.ReactNode; area: 'teacher' | 'student' }) {
  const pathname = usePathname();
  const current = titles[pathname] || { title: area === 'teacher' ? 'Portal do Professor' : 'Portal do Aluno', eyebrow: 'LuminaAI' };
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; type: string; link: string }>>([]);

  useEffect(() => {
    apiFetch<{ notifications: Array<{ id: string; title: string; message: string; type: string; link: string }> }>('/api/notifications')
      .then((data) => setNotifications(data.notifications))
      .catch(() => setNotifications([]));
  }, [pathname]);

  return (
    <section className="app-glass-shell">
      <header className="app-top-header">
        <div>
          <span className="eyebrow">{current.eyebrow}</span>
          <h1>{current.title}</h1>
        </div>
        <div className="app-header-actions">
          <div className="notification-menu">
            <button className="glass-icon-button notification-button" title="Notificações" aria-label="Notificações" onClick={() => setOpen((value) => !value)}>
              o
              {notifications.length > 0 && <span>{notifications.length}</span>}
            </button>
            {open && (
              <div className="notification-popover">
                <div className="glass-card-head">
                  <strong>Central de lembretes</strong>
                  <small>{notifications.length} alerta{notifications.length === 1 ? '' : 's'}</small>
                </div>
                {notifications.length === 0 ? (
                  <p className="muted">Nenhum lembrete urgente no momento.</p>
                ) : (
                  notifications.map((item) => (
                    <a className="notification-item" href={item.link} key={item.id}>
                      <span className={`notification-dot ${item.type}`} />
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.message}</small>
                      </span>
                    </a>
                  ))
                )}
              </div>
            )}
          </div>
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
