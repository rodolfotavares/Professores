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
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">E</div>
        <div>
          <strong>EduAssist Pro</strong>
          <span>Portal do professor</span>
        </div>
      </div>
      {profile?.access_code && <div className="sidebar-code">Codigo: {profile.access_code}</div>}
      <nav className="sidebar-nav">
        <Link href="/teacher">Painel</Link>
        <Link href="/teacher/students">Alunos</Link>
        <Link href="/teacher/schedule">Agenda</Link>
        <Link href="/teacher/activities">Atividades</Link>
        <Link href="/teacher/planner">Planos de aula</Link>
        <Link href="/teacher/messages">Recados</Link>
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
