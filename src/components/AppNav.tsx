'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

export function TeacherNav() {
  return (
    <aside className="sidebar teacher-icon-sidebar">
      <div className="brand compact-brand">
        <div className="brand-mark">L</div>
        <div>
          <strong>LuminaAI</strong>
          <span>Portal do professor</span>
        </div>
      </div>
      <nav className="sidebar-nav icon-nav">
        <NavIcon href="/teacher" label="InÃ­cio" icon="home" />
        <NavIcon href="/teacher/students" label="Alunos" icon="users" />
        <NavIcon href="/teacher/smart-lesson" label="Aula Inteligente" icon="smart" />
        <NavIcon href="/teacher/messages" label="Mensagens" icon="message" />
        <NavIcon href="/teacher/finance" label="Financeiro" icon="chart" />
        <NavIcon href="/teacher/support" label="Suporte" icon="support" />
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
          <strong>LuminaAI</strong>
          <span>Portal do aluno</span>
        </div>
      </div>
      <nav className="sidebar-nav icon-nav">
        <NavIcon href="/student" label="InÃ­cio" icon="home" />
        <NavIcon href="/student/lesson-history" label="HistÃ³rico" icon="smart" />
        <NavIcon href="/student/messages" label="Mensagens" icon="message" />
        <NavIcon href="/student/settings" label="Perfil" icon="users" />
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
      title: 'LuminaAI',
      text: 'Acesse o LuminaAI para professores e alunos.',
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

type IconName = 'home' | 'calendar' | 'users' | 'tasks' | 'chart' | 'message' | 'support' | 'smart';

function Icon({ name }: { name: IconName }) {
  const common = { width: 19, height: 19, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'home') return <svg {...common}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>;
  if (name === 'calendar') return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 11h18" /></svg>;
  if (name === 'users') return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
  if (name === 'tasks') return <svg {...common}><path d="M9 11l2 2 4-5" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
  if (name === 'chart') return <svg {...common}><path d="M4 19V5" /><path d="M4 19h16" /><rect x="7" y="11" width="3" height="5" rx="1" /><rect x="12" y="7" width="3" height="9" rx="1" /><rect x="17" y="9" width="3" height="7" rx="1" /></svg>;
  if (name === 'support') return <svg {...common}><path d="M4 12a8 8 0 0 1 16 0" /><path d="M4 12v3a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2Z" /><path d="M20 12v3a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2Z" /><path d="M14 19h2a4 4 0 0 0 4-4" /><path d="M9 19h3" /></svg>;
  if (name === 'smart') return <svg {...common}><path d="M12 3a6 6 0 0 0-6 6c0 2.1 1.1 3.4 2 4.5.7.8 1 1.5 1 2.5h6c0-1 .3-1.7 1-2.5.9-1.1 2-2.4 2-4.5a6 6 0 0 0-6-6Z" /><path d="M9 19h6" /><path d="M10 22h4" /></svg>;
  return <svg {...common}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" /></svg>;
}

