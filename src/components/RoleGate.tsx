'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/fetcher';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Role = 'teacher' | 'student' | 'admin';

export function RoleGate({ expected, children }: { expected: Role; children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'allowed' | 'blocked'>('checking');
  const [message, setMessage] = useState('Verificando permissao...');

  useEffect(() => {
    let active = true;

    async function checkRole() {
      try {
        const { profile } = await apiFetch<{ profile: { role: Role } }>('/api/me');
        if (!active) return;

        const allowed = profile.role === expected || profile.role === 'admin';
        if (allowed) {
          setStatus('allowed');
          return;
        }

        setStatus('blocked');
        setMessage(profile.role === 'student'
          ? 'Voce esta logado como aluno. Saia e entre com a conta do professor para usar esta area.'
          : 'Voce esta logado como professor. Use a area do professor para gerenciar alunos e aulas.');

        window.setTimeout(() => {
          router.replace(profile.role === 'student' ? '/student' : '/teacher');
        }, 1400);
      } catch {
        if (!active) return;
        setStatus('blocked');
        setMessage('Entre com sua conta para acessar esta area.');
        window.setTimeout(() => router.replace('/login'), 900);
      }
    }

    checkRole();
    return () => {
      active = false;
    };
  }, [expected, router]);

  async function logout() {
    await supabaseBrowser.auth.signOut();
    router.replace('/login');
  }

  if (status === 'allowed') return <>{children}</>;

  return (
    <main className="auth-shell">
      <section className="card stack" style={{ width: '100%', maxWidth: 520 }}>
        <h1>{status === 'checking' ? 'Carregando' : 'Acesso direcionado'}</h1>
        <p className="muted">{message}</p>
        {status === 'blocked' && <button className="btn primary" onClick={logout}>Sair e entrar novamente</button>}
      </section>
    </main>
  );
}
