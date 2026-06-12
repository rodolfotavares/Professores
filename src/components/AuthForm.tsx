'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser, supabaseBrowserConfigured } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/fetcher';

type RegisterMode = 'teacher' | 'student';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabaseBrowserConfigured) {
      setError('Supabase nao configurado. Configure as variaveis de ambiente antes de usar login.');
      return;
    }
    setLoading(true);
    setError('');

    const { error: loginError } = await supabaseBrowser.auth.signInWithPassword({ email, password });
    if (loginError) {
      setError('E-mail ou senha incorretos.');
      setLoading(false);
      return;
    }

    const { profile } = await apiFetch<{ profile: { role: string } }>('/api/me');
    router.push(profile.role === 'student' ? '/student' : '/teacher');
  }

  return (
    <form className="card stack" onSubmit={submit} style={{ width: '100%', maxWidth: 440 }}>
      <h1>Entrar</h1>
      {error && <p className="error">{error}</p>}
      <label className="label">E-mail<input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <label className="label">Senha<input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
      <button className="btn primary" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
    </form>
  );
}

export function RegisterForm({ mode }: { mode: RegisterMode }) {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    whatsapp: '',
    subjects: '',
    access_code: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabaseBrowserConfigured) {
      setError('Supabase nao configurado. Configure as variaveis de ambiente antes de cadastrar usuarios.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let currentRole: string | null = null;
      if (mode === 'student') {
        currentRole = await apiFetch<{ profile: { role: string } }>('/api/me')
          .then((res) => res.profile.role)
          .catch(() => null);
      }

      const path = mode === 'teacher' ? '/api/auth/register-teacher' : '/api/auth/register-student';
      const result = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await result.json();
      if (!result.ok) throw new Error(payload.error || 'Falha no cadastro.');

      if (mode === 'teacher') {
        setSuccess(`Professor criado. Codigo de acesso: ${payload.access_code}`);
      } else {
        setSuccess('Aluno criado e vinculado ao professor.');
      }

      if (mode === 'student' && currentRole === 'teacher') {
        router.push('/teacher/students');
        return;
      }

      await supabaseBrowser.auth.signInWithPassword({ email: form.email, password: form.password });
      router.push(mode === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card stack" onSubmit={submit} style={{ width: '100%', maxWidth: 520 }}>
      <h1>{mode === 'teacher' ? 'Cadastro do Professor' : 'Cadastro do Aluno'}</h1>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      {mode === 'student' && (
        <label className="label">Codigo do professor<input className="input" value={form.access_code} onChange={(e) => set('access_code', e.target.value.toUpperCase())} required /></label>
      )}
      <label className="label">Nome completo<input className="input" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required /></label>
      <label className="label">E-mail<input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required /></label>
      <label className="label">Senha<input className="input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={6} /></label>
      <label className="label">WhatsApp<input className="input" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} /></label>
      {mode === 'teacher' && (
        <label className="label">Materias<input className="input" value={form.subjects} onChange={(e) => set('subjects', e.target.value)} /></label>
      )}
      <button className={mode === 'teacher' ? 'btn primary' : 'btn student'} disabled={loading}>{loading ? 'Criando...' : 'Criar conta'}</button>
    </form>
  );
}
