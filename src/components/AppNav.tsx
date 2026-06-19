'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/fetcher';
import { supabaseBrowser } from '@/lib/supabase-browser';

export function TeacherNav() {
  const [profile, setProfile] = useState<{ full_name?: string; access_code?: string } | null>(null);

  useEffect(() => {
    apiFetch<{ profile: { full_name?: string; access_code?: string } }>('/api/teacher/profile')
      .then((data) => setProfile(data.profile))
      .catch(() => setProfile(null));
  }, []);

  return (
    <aside className="sidebar teacher-icon-sidebar">
      <div className="brand compact-brand">
        <div className="brand-mark">L</div>
        <div>
          <strong>Lumina</strong>
          <span>Portal do professor</span>
        </div>
      </div>
      {profile?.access_code && <div className="sidebar-code compact-code">{profile.access_code}</div>}
      <nav className="sidebar-nav icon-nav">
        <NavIcon href="/teacher" label="Início" icon="home" />
        <NavIcon href="/teacher/classes" label="Turmas" icon="classes" />
        <NavIcon href="/teacher/students" label="Alunos" icon="users" />
        <NavIcon href="/teacher/activities" label="Atividades" icon="tasks" />
        <NavIcon href="/teacher/grades" label="Notas" icon="grades" />
        <NavIcon href="/teacher/frequency" label="Frequência" icon="frequency" />
        <NavIcon href="/teacher/schedule" label="Agenda" icon="calendar" />
        <NavIcon href="/teacher/finance" label="Relatórios" icon="chart" />
        <NavIcon href="/teacher/messages" label="Mensagens" icon="message" />
        <NavIcon href="/teacher/settings" label="Configurações" icon="settings" />
        <NavIcon href="/teacher/planner" label="Planos de aula" icon="planner" />
        <NavIcon href="/teacher/news" label="Notícias" icon="news" />
        <NavIcon href="/teacher/tutorial" label="Tutorial" icon="phone" />
      </nav>
      <SidebarActions />
    </aside>
  );
}

export function StudentNav() {
  return (
    <aside className="sidebar teacher-icon-sidebar">
      <div className="brand compact-brand">
        <div className="brand-mark">L</div>
        <div>
          <strong>Lumina</strong>
          <span>Portal do aluno</span>
        </div>
      </div>
      <nav className="sidebar-nav icon-nav">
        <NavIcon href="/student" label="Início" icon="home" />
        <NavIcon href="/student/activities" label="Atividades" icon="tasks" />
        <NavIcon href="/student/grades" label="Notas" icon="grades" />
        <NavIcon href="/student/frequency" label="Frequência" icon="frequency" />
        <NavIcon href="/student/schedule" label="Agenda" icon="calendar" />
        <NavIcon href="/student/messages" label="Mensagens" icon="message" />
        <NavIcon href="/student/settings" label="Perfil" icon="settings" />
        <NavIcon href="/student/tutorial" label="Tutorial" icon="phone" />
      </nav>
      <SidebarActions />
    </aside>
  );
}

function SidebarActions() {
  return (
    <div className="sidebar-actions">
      <LogoutButton />
      <ShareButton />
    </div>
  );
}

function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await supabaseBrowser.auth.signOut();
    router.push('/login');
  }

  return (
    <button className="btn logout sidebar-action-button" onClick={logout} title="Sair" aria-label="Sair">
      <LogoutIcon />
      <span>Sair</span>
    </button>
  );
}

function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.origin;
    const data = {
      title: 'Lumina',
      text: 'Acesse o Lumina para professores e alunos.',
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button className="btn share-app sidebar-action-button" onClick={share} title={copied ? 'Link copiado' : 'Compartilhar'} aria-label={copied ? 'Link copiado' : 'Compartilhar'}>
      <ShareIcon />
      <span>{copied ? 'Copiado' : 'Compartilhar'}</span>
    </button>
  );
}

function NavIcon({ href, label, icon }: { href: string; label: string; icon: IconName }) {
  return (
    <Link href={href} aria-label={label} title={label}>
      <Icon name={icon} />
      <span>{label}</span>
    </Link>
  );
}

function LogoutIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 19V5a2 2 0 0 0-2-2h-5" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 10.7l6.8-4.4" />
      <path d="M8.6 13.3l6.8 4.4" />
    </svg>
  );
}

type IconName = 'home' | 'calendar' | 'users' | 'tasks' | 'chart' | 'settings' | 'planner' | 'news' | 'message' | 'classes' | 'grades' | 'frequency' | 'materials' | 'phone';

function Icon({ name }: { name: IconName }) {
  const common = { width: 19, height: 19, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'home') return <svg {...common}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>;
  if (name === 'calendar') return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 11h18" /></svg>;
  if (name === 'classes') return <svg {...common}><path d="M4 19.5V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-1.5Z" /><path d="M8 7h6M8 11h7M8 15h5" /></svg>;
  if (name === 'users') return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
  if (name === 'tasks') return <svg {...common}><path d="M9 11l2 2 4-5" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
  if (name === 'grades') return <svg {...common}><path d="M12 3l2.7 5.47 6.03.88-4.36 4.25 1.03 6-5.4-2.84-5.4 2.84 1.03-6-4.36-4.25 6.03-.88L12 3Z" /></svg>;
  if (name === 'frequency') return <svg {...common}><path d="M4 19V5" /><path d="M4 19h16" /><path d="M7 15l3-3 3 2 5-7" /></svg>;
  if (name === 'chart') return <svg {...common}><path d="M4 19V5" /><path d="M4 19h16" /><rect x="7" y="11" width="3" height="5" rx="1" /><rect x="12" y="7" width="3" height="9" rx="1" /><rect x="17" y="9" width="3" height="7" rx="1" /></svg>;
  if (name === 'settings') return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.37.52.7.91.9.34.18.72.27 1.1.27H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" /></svg>;
  if (name === 'planner') return <svg {...common}><path d="M4 19.5V5a2 2 0 0 1 2-2h11a3 3 0 0 1 3 3v15H6a2 2 0 0 1-2-1.5Z" /><path d="M8 7h6" /><path d="M8 11h8" /><path d="M8 15h4" /><path d="M17 3v6h3" /></svg>;
  if (name === 'news') return <svg {...common}><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>;
  if (name === 'materials') return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h5" /></svg>;
  if (name === 'phone') return <svg {...common}><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /><path d="M10 6h4" /></svg>;
  return <svg {...common}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" /></svg>;
}
