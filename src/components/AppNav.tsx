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
        <div className="brand-mark">E</div>
        <div>
          <strong>EduAssist Pro</strong>
          <span>Portal do professor</span>
        </div>
      </div>
      {profile?.access_code && <div className="sidebar-code compact-code">{profile.access_code}</div>}
      <nav className="sidebar-nav icon-nav">
        <NavIcon href="/teacher" label="Home" icon="home" />
        <NavIcon href="/teacher/schedule" label="Turmas" icon="calendar" />
        <NavIcon href="/teacher/students" label="Alunos" icon="users" />
        <NavIcon href="/teacher/activities" label="Atividades" icon="tasks" />
        <NavIcon href="/teacher/finance" label="Relatorios" icon="chart" />
        <NavIcon href="/teacher/planner" label="Planejar" icon="settings" />
        <NavIcon href="/teacher/news" label="Noticias" icon="news" />
        <NavIcon href="/teacher/messages" label="Recados" icon="message" />
      </nav>
      <LogoutButton />
    </aside>
  );
}

export function StudentNav() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">E</div>
        <div>
          <strong>EduAssist Pro</strong>
          <span>Portal do aluno</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        <Link href="/student">Inicio</Link>
        <Link href="/student/schedule">Agenda</Link>
        <Link href="/student/activities">Atividades</Link>
        <Link href="/student/messages">Recados</Link>
      </nav>
      <LogoutButton />
    </aside>
  );
}

function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await supabaseBrowser.auth.signOut();
    router.push('/login');
  }

  return <button className="btn logout" onClick={logout}>Sair</button>;
}

function NavIcon({ href, label, icon }: { href: string; label: string; icon: IconName }) {
  return (
    <Link href={href} aria-label={label} title={label}>
      <Icon name={icon} />
      <span>{label}</span>
    </Link>
  );
}

type IconName = 'home' | 'calendar' | 'users' | 'tasks' | 'chart' | 'settings' | 'news' | 'message';

function Icon({ name }: { name: IconName }) {
  const common = { width: 19, height: 19, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'home') return <svg {...common}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>;
  if (name === 'calendar') return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 11h18" /></svg>;
  if (name === 'users') return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
  if (name === 'tasks') return <svg {...common}><path d="M9 11l2 2 4-5" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
  if (name === 'chart') return <svg {...common}><path d="M4 19V5" /><path d="M4 19h16" /><rect x="7" y="11" width="3" height="5" rx="1" /><rect x="12" y="7" width="3" height="9" rx="1" /><rect x="17" y="9" width="3" height="7" rx="1" /></svg>;
  if (name === 'settings') return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.37.52.7.91.9.34.18.72.27 1.1.27H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" /></svg>;
  if (name === 'news') return <svg {...common}><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>;
  return <svg {...common}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" /></svg>;
}
