'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/fetcher';

const titles: Record<string, { title: string; eyebrow: string }> = {
  '/teacher': { title: 'Painel', eyebrow: 'Portal do Professor' },
  '/teacher/students': { title: 'Alunos', eyebrow: 'Gestão' },
  '/teacher/activities': { title: 'Atividades', eyebrow: 'Tarefas' },
  '/teacher/schedule': { title: 'Agenda', eyebrow: 'Calendário' },
  '/teacher/finance': { title: 'Financeiro', eyebrow: 'Receita' },
  '/teacher/messages': { title: 'Mensagens', eyebrow: 'Comunicação' },
  '/teacher/support': { title: 'Suporte', eyebrow: 'Ajuda' },
  '/teacher/settings': { title: 'Configurações', eyebrow: 'Conta' },
  '/teacher/planner': { title: 'Planos de aula', eyebrow: 'Planejamento' },
  '/teacher/news': { title: 'Notícias', eyebrow: 'Curadoria' },
  '/teacher/tutorial': { title: 'Tutorial', eyebrow: 'Instalação' },
  '/teacher/classes': { title: 'Turmas', eyebrow: 'Organização' },
  '/teacher/grades': { title: 'Notas', eyebrow: 'Avaliação' },
  '/teacher/frequency': { title: 'Frequência', eyebrow: 'Presença' },
  '/student': { title: 'Painel', eyebrow: 'Portal do Aluno' },
  '/student/activities': { title: 'Atividades', eyebrow: 'Tarefas' },
  '/student/schedule': { title: 'Agenda', eyebrow: 'Calendário' },
  '/student/messages': { title: 'Mensagens', eyebrow: 'Comunicação' },
  '/student/settings': { title: 'Perfil', eyebrow: 'Conta' },
  '/student/tutorial': { title: 'Tutorial', eyebrow: 'Instalação' },
  '/student/classes': { title: 'Minhas aulas', eyebrow: 'Aulas' },
  '/student/grades': { title: 'Notas', eyebrow: 'Desempenho' },
  '/student/frequency': { title: 'Frequência', eyebrow: 'Presença' },
  '/student/materials': { title: 'Materiais', eyebrow: 'Arquivos' },
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string;
};

export function AppLayout({ children, area }: { children: React.ReactNode; area: 'teacher' | 'student' }) {
  const pathname = usePathname();
  const current = titles[pathname] || { title: area === 'teacher' ? 'Portal do Professor' : 'Portal do Aluno', eyebrow: 'LuminaAI' };
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    apiFetch<{ notifications: NotificationItem[] }>('/api/notifications')
      .then((data) => setNotifications(data.notifications))
      .catch(() => setNotifications([]));
  }, [pathname]);

  return (
    <section className="app-glass-shell clean-shell">
      <header className="app-top-header clean-topbar">
        <div className="app-title-block">
          <span className="eyebrow">{current.eyebrow}</span>
          <h1>{current.title}</h1>
        </div>

        <div className="app-search" role="search">
          <SearchIcon />
          <input aria-label="Buscar" placeholder={area === 'teacher' ? 'Buscar alunos, aulas, atividades...' : 'Buscar aulas, atividades, mensagens...'} />
          <kbd>Ctrl K</kbd>
        </div>

        <div className="app-header-actions">
          <div className="notification-menu">
            <button className="glass-icon-button notification-button" title="Notificações" aria-label="Notificações" onClick={() => setOpen((value) => !value)}>
              <BellIcon />
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
                    <Link className="notification-item" href={item.link} key={item.id} onClick={() => setOpen(false)}>
                      <span className={`notification-dot ${item.type}`} />
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.message}</small>
                      </span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
          <Link className="glass-icon-button header-message-button" href={area === 'teacher' ? '/teacher/messages' : '/student/messages'} title="Mensagens" aria-label="Mensagens">
            <MessageIcon />
          </Link>
          <div className="profile-chip">
            <div className="teacher-avatar">{area === 'teacher' ? 'P' : 'A'}</div>
            <span>{area === 'teacher' ? 'Professor' : 'Aluno'}</span>
          </div>
        </div>
      </header>

      <div className="app-content">{children}</div>
    </section>
  );
}

export function GlobalBackground() {
  return null;
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

function SearchIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M10 21h4" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
    </svg>
  );
}
