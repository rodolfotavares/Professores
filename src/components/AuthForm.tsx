'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser, supabaseBrowserConfigured } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/fetcher';
import { formatBrazilWhatsapp, isStrongPassword, isValidBrazilPhone, normalizeBrazilPhone, passwordRuleMessage } from '@/lib/validation';

type RegisterMode = 'teacher' | 'student';
type AuthProfile = {
  role: string;
  subscription?: { status: string } | null;
};

function portalPath(profile: AuthProfile) {
  if (profile.role === 'student') return '/student';
  if (profile.role === 'teacher' && profile.subscription?.status !== 'paid' && profile.subscription?.status !== 'exempt') {
    return '/teacher/finance';
  }
  return '/teacher';
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabaseBrowserConfigured) {
      setError('Supabase não configurado. Configure as variáveis de ambiente antes de usar login.');
      return;
    }
    setLoading(true);
    setError('');

    await supabaseBrowser.auth.signOut();
    const { error: loginError } = await supabaseBrowser.auth.signInWithPassword({ email, password });
    if (loginError) {
      setError('E-mail ou senha incorretos.');
      setLoading(false);
      return;
    }

    const { profile } = await apiFetch<{ profile: AuthProfile }>('/api/me');
    router.push(portalPath(profile));
  }

  return (
    <form className="card stack auth-card" onSubmit={submit}>
      <div className="auth-heading">
        <span className="eyebrow">LuminaAI</span>
        <h1>Entrar</h1>
        <p>Acesse seu portal com e-mail e senha.</p>
      </div>
      {error && <p className="error">{error}</p>}
      <label className="label">E-mail<input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <label className="label">Senha
        <span className="password-field">
          <input className="input" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="button" onClick={() => setShowPassword((current) => !current)}>{showPassword ? 'Ocultar' : 'Mostrar'}</button>
        </span>
      </label>
      <button className="btn primary" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
      <a className="forgot-link" href="/forgot-password">Esqueci minha senha</a>
      <div className="row auth-links">
        <a href="/register/teacher">Criar professor</a>
        <a href="/register/student">Criar aluno</a>
      </div>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabaseBrowserConfigured) {
      setError('Supabase não configurado. Configure as variáveis de ambiente antes de recuperar senha.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabaseBrowser.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) throw resetError;
      setSuccess('Enviamos um e-mail com o link para redefinir sua senha. Verifique tambem a caixa de spam.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card stack auth-card" onSubmit={submit}>
      <div className="auth-heading">
        <span className="eyebrow">LuminaAI</span>
        <h1>Recuperar senha</h1>
        <p>Informe seu e-mail para receber o link de recuperacao.</p>
      </div>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <label className="label">E-mail<input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <button className="btn primary" disabled={loading}>{loading ? 'Enviando...' : 'Enviar e-mail'}</button>
      <a className="forgot-link" href="/login">Voltar para o login</a>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabaseBrowserConfigured) {
      setError('Supabase não configurado. Configure as variáveis de ambiente antes de alterar senha.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!isStrongPassword(password)) throw new Error(passwordRuleMessage);
      if (password !== confirmPassword) throw new Error('A confirmacao da senha precisa ser igual a senha.');

      const { error: updateError } = await supabaseBrowser.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess('Senha alterada com sucesso. Voce ja pode entrar com a nova senha.');
      window.setTimeout(() => router.push('/login'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível alterar a senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card stack auth-card" onSubmit={submit}>
      <div className="auth-heading">
        <span className="eyebrow">LuminaAI</span>
        <h1>Nova senha</h1>
        <p>Digite e confirme sua nova senha.</p>
      </div>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <label className="label">Nova senha<input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} pattern="^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$" title={passwordRuleMessage} /></label>
      <label className="label">Confirmar nova senha<input className="input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} /></label>
      <p className="muted auth-hint">{passwordRuleMessage}</p>
      <button className="btn primary" disabled={loading}>{loading ? 'Salvando...' : 'Alterar senha'}</button>
    </form>
  );
}

export function RegisterForm({ mode }: { mode: RegisterMode }) {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
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
      setError('Supabase não configurado. Configure as variáveis de ambiente antes de cadastrar usuários.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!isStrongPassword(form.password)) {
        throw new Error(passwordRuleMessage);
      }
      if (form.password !== form.confirm_password) {
        throw new Error('A confirmacao da senha precisa ser igual a senha.');
      }
      if (!isValidBrazilPhone(form.whatsapp)) {
        throw new Error('Informe um WhatsApp brasileiro valido com DDD, usando 10 ou 11 digitos.');
      }

      await supabaseBrowser.auth.signOut();

      const path = mode === 'teacher' ? '/api/auth/register-teacher' : '/api/auth/register-student';
      const result = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, whatsapp: normalizeBrazilPhone(form.whatsapp) }),
      });
      const payload = await result.json();
      if (!result.ok) throw new Error(payload.error || 'Falha no cadastro.');

      if (mode === 'teacher') {
        setSuccess(`Professor criado. Código de acesso: ${payload.access_code}`);
      } else {
        setSuccess('Aluno criado e vinculado ao professor.');
      }

      const { error: signInError } = await supabaseBrowser.auth.signInWithPassword({ email: form.email, password: form.password });
      if (signInError) throw new Error('Conta criada, mas não foi possível entrar automaticamente. Tente fazer login.');

      const { profile } = await apiFetch<{ profile: AuthProfile }>('/api/me');
      if (profile.role !== mode) {
        await supabaseBrowser.auth.signOut();
        throw new Error(mode === 'student'
          ? 'Cadastro criado, mas o perfil não foi reconhecido como aluno. Entre em contato com o suporte.'
          : 'Cadastro criado, mas o perfil não foi reconhecido como professor. Entre em contato com o suporte.');
      }

      router.push(portalPath(profile));
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
        <label className="label">Código do professor<input className="input" value={form.access_code} onChange={(e) => set('access_code', e.target.value.toUpperCase())} required /></label>
      )}
      <label className="label">Nome completo<input className="input" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required /></label>
      <label className="label">E-mail<input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required /></label>
      <label className="label">Senha<input className="input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={6} pattern="^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$" title={passwordRuleMessage} /></label>
      <label className="label">Confirmar senha<input className="input" type="password" value={form.confirm_password} onChange={(e) => set('confirm_password', e.target.value)} required minLength={6} /></label>
      <p className="muted auth-hint">{passwordRuleMessage}</p>
      <label className="label">WhatsApp<input className="input" inputMode="numeric" autoComplete="tel" value={form.whatsapp} onChange={(e) => set('whatsapp', formatBrazilWhatsapp(e.target.value))} placeholder="(11) 99999-9999" /></label>
      {mode === 'teacher' && (
        <label className="label">Matérias<input className="input" value={form.subjects} onChange={(e) => set('subjects', e.target.value)} /></label>
      )}
      <button className={mode === 'teacher' ? 'btn primary' : 'btn student'} disabled={loading}>{loading ? 'Criando...' : 'Criar conta'}</button>
    </form>
  );
}
