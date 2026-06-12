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
    <>
      <div className="topbar">
        <div>
          <span className="eyebrow">Area do professor</span>
          <strong>{profile?.full_name || 'Professor'}</strong>
        </div>
        {profile?.access_code && <span className="code-pill">Codigo: {profile.access_code}</span>}
      </div>
      <nav className="nav teacher-nav">
        <Link href="/teacher">Painel</Link>
        <Link href="/teacher/students">Alunos</Link>
        <Link href="/teacher/schedule">Agenda</Link>
        <Link href="/teacher/activities">Atividades</Link>
        <Link href="/teacher/messages">Recados</Link>
        <LogoutButton tone="teacher" />
      </nav>
    </>
  );
}

export function StudentNav() {
  return (
    <>
      <div className="topbar">
        <div>
          <span className="eyebrow">Area do aluno</span>
          <strong>EduAssist Pro</strong>
        </div>
      </div>
      <nav className="nav student-nav">
        <Link href="/student">Inicio</Link>
        <Link href="/student/schedule">Agenda</Link>
        <Link href="/student/activities">Atividades</Link>
        <Link href="/student/messages">Recados</Link>
        <LogoutButton tone="student" />
      </nav>
    </>
  );
}

function LogoutButton({ tone }: { tone: 'teacher' | 'student' }) {
  const router = useRouter();

  async function logout() {
    await supabaseBrowser.auth.signOut();
    router.push('/login');
  }

  return <button className={`btn logout ${tone}`} onClick={logout}>Sair</button>;
}
