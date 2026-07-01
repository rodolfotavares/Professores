'use client';

import Link from 'next/link';
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
      setError('Supabase nÃ£o configurado. Configure as variÃ¡veis de ambiente antes de usar login.');
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
    <form className="auth-panel-card" onSubmit={submit}>
      <AuthBrand />
      <div className="auth-heading">
        <span className="eyebrow">Bem-vindo de volta</span>
        <h1>Entrar no LuminaAI</h1>
        <p>Acesse seu painel para acompanhar aulas, alunos, evolução e pagamentos.</p>
      </div>
      {error && <p className="error">{error}</p>}
      <label className="label">E-mail<input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <label className="label">Senha
        <span className="password-field">
          <input className="input" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="button" onClick={() => setShowPassword((current) => !current)}>{showPassword ? 'Ocultar' : 'Mostrar'}</button>
        </span>
      </label>
      <button className="flow-login-button auth-submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
      <Link className="forgot-link" href="/forgot-password">Esqueci minha senha</Link>
      <div className="auth-links">
        <Link href="/register/teacher">Criar conta de professor</Link>
        <Link href="/register/student">Criar conta de aluno</Link>
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
      setError('Supabase nÃ£o configurado. Configure as variÃ¡veis de ambiente antes de recuperar senha.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabaseBrowser.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) throw resetError;
      setSuccess('Enviamos um e-mail com o link para redefinir sua senha. Verifique tambÃ©m a caixa de spam.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'NÃ£o foi possÃ­vel enviar o e-mail de recuperaÃ§Ã£o.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-panel-card" onSubmit={submit}>
      <AuthBrand />
      <div className="auth-heading">
        <span className="eyebrow">RecuperaÃ§Ã£o</span>
        <h1>Recuperar senha</h1>
        <p>Informe seu e-mail para receber o link de redefiniÃ§Ã£o.</p>
      </div>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <label className="label">E-mail<input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <button className="flow-login-button auth-submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar e-mail'}</button>
      <Link className="forgot-link" href="/login">Voltar para o login</Link>
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
      setError('Supabase nÃ£o configurado. Configure as variÃ¡veis de ambiente antes de alterar senha.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!isStrongPassword(password)) throw new Error(passwordRuleMessage);
      if (password !== confirmPassword) throw new Error('A confirmaÃ§Ã£o da senha precisa ser igual Ã  senha.');

      const { error: updateError } = await supabaseBrowser.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess('Senha alterada com sucesso. VocÃª jÃ¡ pode entrar com a nova senha.');
      window.setTimeout(() => router.push('/login'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'NÃ£o foi possÃ­vel alterar a senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-panel-card" onSubmit={submit}>
      <AuthBrand />
      <div className="auth-heading">
        <span className="eyebrow">SeguranÃ§a</span>
        <h1>Nova senha</h1>
        <p>Digite e confirme sua nova senha de acesso.</p>
      </div>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <label className="label">Nova senha<input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} pattern="^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$" title={passwordRuleMessage} /></label>
      <label className="label">Confirmar nova senha<input className="input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} /></label>
      <p className="muted auth-hint">{passwordRuleMessage}</p>
      <button className="flow-login-button auth-submit" disabled={loading}>{loading ? 'Salvando...' : 'Alterar senha'}</button>
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
      setError('Supabase nÃ£o configurado. Configure as variÃ¡veis de ambiente antes de cadastrar usuÃ¡rios.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!isStrongPassword(form.password)) throw new Error(passwordRuleMessage);
      if (form.password !== form.confirm_password) throw new Error('A confirmaÃ§Ã£o da senha precisa ser igual Ã  senha.');
      if (!isValidBrazilPhone(form.whatsapp)) throw new Error('Informe um WhatsApp brasileiro vÃ¡lido com DDD, usando 10 ou 11 dÃ­gitos.');

      await supabaseBrowser.auth.signOut();

      const path = mode === 'teacher' ? '/api/auth/register-teacher' : '/api/auth/register-student';
      const result = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, whatsapp: normalizeBrazilPhone(form.whatsapp) }),
      });
      const payload = await result.json();
      if (!result.ok) throw new Error(payload.error || 'Falha no cadastro.');

      setSuccess(mode === 'teacher' ? `Professor criado. CÃ³digo de acesso: ${payload.access_code}` : 'Aluno criado e vinculado ao professor.');

      const { error: signInError } = await supabaseBrowser.auth.signInWithPassword({ email: form.email, password: form.password });
      if (signInError) throw new Error('Conta criada, mas nÃ£o foi possÃ­vel entrar automaticamente. Tente fazer login.');

      const { profile } = await apiFetch<{ profile: AuthProfile }>('/api/me');
      if (profile.role !== mode) {
        await supabaseBrowser.auth.signOut();
        throw new Error(mode === 'student'
          ? 'Cadastro criado, mas o perfil nÃ£o foi reconhecido como aluno. Entre em contato com o suporte.'
          : 'Cadastro criado, mas o perfil nÃ£o foi reconhecido como professor. Entre em contato com o suporte.');
      }

      router.push(portalPath(profile));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-panel-card auth-register-card" onSubmit={submit}>
      <AuthBrand />
      <div className="auth-heading">
        <span className="eyebrow">{mode === 'teacher' ? 'Portal do professor' : 'Portal do aluno'}</span>
        <h1>{mode === 'teacher' ? 'Criar conta de professor' : 'Criar conta de aluno'}</h1>
        <p>{mode === 'teacher' ? 'Comece organizando sua rotina de aulas em um painel profissional.' : 'Entre com o cÃ³digo recebido do professor para vincular sua conta.'}</p>
      </div>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      {mode === 'student' && (
        <label className="label">CÃ³digo do professor<input className="input" value={form.access_code} onChange={(e) => set('access_code', e.target.value.toUpperCase())} required /></label>
      )}
      <label className="label">Nome completo<input className="input" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required /></label>
      <label className="label">E-mail<input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required /></label>
      <label className="label">Senha<input className="input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={6} pattern="^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$" title={passwordRuleMessage} /></label>
      <label className="label">Confirmar senha<input className="input" type="password" value={form.confirm_password} onChange={(e) => set('confirm_password', e.target.value)} required minLength={6} /></label>
      <p className="muted auth-hint">{passwordRuleMessage}</p>
      <label className="label">WhatsApp<input className="input" inputMode="numeric" autoComplete="tel" value={form.whatsapp} onChange={(e) => set('whatsapp', formatBrazilWhatsapp(e.target.value))} placeholder="(11) 99999-9999" /></label>
      {mode === 'teacher' && (
        <label className="label">MatÃ©rias<input className="input" value={form.subjects} onChange={(e) => set('subjects', e.target.value)} /></label>
      )}
      <button className="flow-login-button auth-submit" disabled={loading}>{loading ? 'Criando...' : 'Criar conta'}</button>
      <div className="auth-links">
        <Link href="/login">JÃ¡ tenho uma conta</Link>
        <Link href={mode === 'teacher' ? '/register/student' : '/register/teacher'}>{mode === 'teacher' ? 'Sou aluno' : 'Sou professor'}</Link>
      </div>
    </form>
  );
}

function AuthBrand() {
  return (
    <Link className="auth-brand" href="/">
      <span>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 10h18M7 15h10" />
        </svg>
      </span>
      <strong>LuminaAI</strong>
    </Link>
  );
}

