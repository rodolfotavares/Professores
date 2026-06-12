'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

export function TeacherNav() {
  return (
    <nav className="nav">
      <Link href="/teacher">Painel</Link>
      <Link href="/teacher/students">Alunos</Link>
      <Link href="/teacher/schedule">Agenda</Link>
      <Link href="/teacher/activities">Atividades</Link>
      <Link href="/teacher/messages">Recados</Link>
      <LogoutButton />
    </nav>
  );
}

export function StudentNav() {
  return (
    <nav className="nav">
      <Link href="/student">Inicio</Link>
      <Link href="/student/schedule">Agenda</Link>
      <Link href="/student/activities">Atividades</Link>
      <Link href="/student/messages">Recados</Link>
      <LogoutButton />
    </nav>
  );
}

function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await supabaseBrowser.auth.signOut();
    router.push('/login');
  }

  return <button className="btn" onClick={logout}>Sair</button>;
}
