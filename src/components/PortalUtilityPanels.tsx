'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { GlassCard, MetricCard, StatusBadge } from '@/components/AppShell';
import { EmptyState, StatusMessage } from '@/components/PanelState';
import { apiFetch } from '@/lib/fetcher';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { isStrongPassword, passwordRuleMessage } from '@/lib/validation';
import type { Activity, ActivitySubmission, ClassSchedule, Student } from '@/types';

function usePanelLoad(load: () => Promise<void>, interval = 15000) {
  useEffect(() => {
    load();
    const timer = window.setInterval(load, interval);
    return () => window.clearInterval(timer);
  }, []);
}

function SectionIntro({ title, text }: { title: string; text: string }) {
  return (
    <div className="section-intro">
      <span className="eyebrow">LuminaAI</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function statusTone(status?: string) {
  if (status === 'completed' || status === 'corrected' || status === 'active') return 'success';
  if (status === 'scheduled' || status === 'submitted' || status === 'pending') return 'warning';
  return 'default';
}

function statusLabel(status?: string) {
  const labels: Record<string, string> = {
    active: 'Ativo',
    paused: 'Pausado',
    inactive: 'Inativo',
    scheduled: 'Agendada',
    completed: 'Realizada',
    cancelled: 'Cancelada',
    absence: 'Falta',
    pending: 'Pendente',
    submitted: 'Enviada',
    corrected: 'Corrigida',
  };
  return status ? labels[status] || status : '';
}

function PasswordChangeCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!isStrongPassword(newPassword)) throw new Error(passwordRuleMessage);
      if (newPassword !== confirmPassword) throw new Error('A confirmação da senha precisa ser igual a nova senha.');

      const { data: userData, error: userError } = await supabaseBrowser.auth.getUser();
      const email = userData.user?.email;
      if (userError || !email) throw new Error('Não foi possível confirmar sua sessão.');

      const { error: signInError } = await supabaseBrowser.auth.signInWithPassword({ email, password: currentPassword });
      if (signInError) throw new Error('Senha atual incorreta.');

      const { error: updateError } = await supabaseBrowser.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Senha alterada com segurança.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível alterar a senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard className="portal-summary-card">
      <span className="eyebrow">Segurança</span>
      <h2>Alterar senha</h2>
      <p className="muted">Confirme sua senha atual antes de criar uma nova senha de acesso.</p>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form className="stack password-change-form" onSubmit={submit}>
        <label className="label">Senha atual<input className="input" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></label>
        <label className="label">Nova senha<input className="input" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={6} /></label>
        <label className="label">Confirmar nova senha<input className="input" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={6} /></label>
        <p className="muted auth-hint">{passwordRuleMessage}</p>
        <button className="flow-login-button" disabled={loading}>{loading ? 'Alterando...' : 'Alterar senha'}</button>
      </form>
    </GlassCard>
  );
}

function LanguagePreferenceCard() {
  const [language, setLanguage] = useState('pt-BR');

  useEffect(() => {
    setLanguage(window.localStorage.getItem('lumina-language') || 'pt-BR');
  }, []);

  function updateLanguage(nextLanguage: string) {
    const currentLanguage = window.localStorage.getItem('lumina-language') || 'pt-BR';
    setLanguage(nextLanguage);
    window.localStorage.setItem('lumina-language', nextLanguage);
    document.documentElement.lang = nextLanguage === 'en-US' ? 'en' : 'pt-BR';
    window.dispatchEvent(new CustomEvent('lumina-language-change', { detail: nextLanguage }));
    if (currentLanguage !== nextLanguage) {
      window.setTimeout(() => window.location.reload(), 180);
    }
  }

  return (
    <GlassCard className="portal-summary-card language-card">
      <span className="eyebrow">Idioma</span>
      <h2>{language === 'en-US' ? 'English' : 'Português'}</h2>
      <p className="muted">Escolha o idioma de preferência do app neste dispositivo.</p>
      <div className="language-options">
        <button className={language === 'pt-BR' ? 'selected' : ''} onClick={() => updateLanguage('pt-BR')}>Português</button>
        <button className={language === 'en-US' ? 'selected' : ''} onClick={() => updateLanguage('en-US')}>English</button>
      </div>
    </GlassCard>
  );
}

const supportAnswers = [
  {
    keywords: ['aluno', 'vincular', 'codigo', 'código', 'cadastro'],
    answer: 'Para vincular um aluno, o professor deve abrir Configurações, copiar o código do professor e pedir para o aluno usar esse código no cadastro.',
  },
  {
    keywords: ['agenda', 'aula', 'horario', 'horário', 'presenca', 'presença'],
    answer: 'A agenda nasce dos dias e horários cadastrados no aluno. O professor acompanha e ajusta aulas no cadastro do aluno, e o aluno visualiza os próximos encontros no Início do portal.',
  },
  {
    keywords: ['mensagem', 'recado', 'chat'],
    answer: 'Use a aba Mensagens para conversar com cada aluno. Selecione o aluno, escreva o recado e envie.',
  },
  {
    keywords: ['financeiro', 'pagamento', 'valor', 'mensalidade', 'ganho'],
    answer: 'A previsão financeira usa o número de aulas por semana e o valor por aula definidos no cadastro do aluno.',
  },
  {
    keywords: ['instalar', 'celular', 'android', 'iphone', 'pwa'],
    answer: 'Abra a aba Tutorial para ver como instalar o LuminaAI na tela inicial do Android ou iPhone.',
  },
];

function supportReply(question: string) {
  const normalized = question.toLowerCase();
  const match = supportAnswers.find((item) => item.keywords.some((keyword) => normalized.includes(keyword)));
  if (match) return match.answer;
  return 'Posso ajudar somente com funções do LuminaAI: alunos, aulas, mensagens, financeiro, instalação, suporte e configurações.';
}

export function TeacherSupportPanel() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Ola! Sou o assistente do LuminaAI. Posso ajudar com funções do app, como alunos, aulas, mensagens e financeiro.' },
  ]);
  const [question, setQuestion] = useState('');

  function sendQuestion(event: FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text) return;
    setMessages((current) => [
      ...current,
      { role: 'user', text },
      { role: 'assistant', text: supportReply(text) },
    ]);
    setQuestion('');
  }

  return (
    <div className="stack portal-tab">
      <SectionIntro title="Suporte" text="Contato direto e ajuda rápida sobre as funções do LuminaAI." />
      <div className="grid grid-2">
        <GlassCard className="support-contact-card">
          <span className="eyebrow">WhatsApp</span>
          <h2>Atendimento LuminaAI</h2>
          <p className="muted">Fale com o suporte pelo WhatsApp para dúvidas sobre uso do app.</p>
          <a className="btn primary" href="https://wa.me/14023667683" target="_blank">Chamar no WhatsApp</a>
          <p className="support-phone">+1 (402) 366-7683</p>
        </GlassCard>
        <GlassCard className="support-chat-card">
          <span className="eyebrow">Chat IA</span>
          <h2>Ajuda sobre o app</h2>
          <div className="support-chat-window">
            {messages.map((message, index) => (
              <div className={`support-message ${message.role}`} key={`${message.role}-${index}`}>
                {message.text}
              </div>
            ))}
          </div>
          <form className="support-chat-form" onSubmit={sendQuestion}>
            <input className="input" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Pergunte sobre uma função do LuminaAI" />
            <button className="btn primary">Enviar</button>
          </form>
        </GlassCard>
      </div>
      <div className="grid grid-2">
        <LanguagePreferenceCard />
      </div>
      <GlassCard className="support-shortcuts-card">
        <div className="glass-card-head">
          <div>
            <span className="eyebrow">Extras sem poluir o menu</span>
            <strong>Ferramentas secundárias</strong>
          </div>
        </div>
        <div className="support-shortcuts">
          <Link className="support-shortcut" href="/teacher/settings">
            <strong>Configurações</strong>
            <small>Código do professor, idioma e conta.</small>
          </Link>
          <Link className="support-shortcut" href="/teacher/tutorial">
            <strong>Tutorial de instalação</strong>
            <small>Android, iPhone e login do aluno.</small>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}

export function StudentSupportPanel() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Olá! Sou o assistente do LuminaAI. Posso ajudar com aulas, mensagens, evolução, instalação e perfil.' },
  ]);
  const [question, setQuestion] = useState('');

  function sendQuestion(event: FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text) return;
    setMessages((current) => [
      ...current,
      { role: 'user', text },
      { role: 'assistant', text: supportReply(text) },
    ]);
    setQuestion('');
  }

  return (
    <div className="stack portal-tab">
      <SectionIntro title="Suporte" text="Ajuda rápida para usar o portal do aluno no LuminaAI." />
      <div className="grid grid-2">
        <GlassCard className="support-contact-card">
          <span className="eyebrow">WhatsApp</span>
          <h2>Atendimento LuminaAI</h2>
          <p className="muted">Fale com o suporte pelo WhatsApp para dúvidas sobre uso do app.</p>
          <a className="btn primary" href="https://wa.me/14023667683" target="_blank">Chamar no WhatsApp</a>
          <p className="support-phone">+1 (402) 366-7683</p>
        </GlassCard>
        <GlassCard className="support-chat-card">
          <span className="eyebrow">Chat IA</span>
          <h2>Ajuda sobre o app</h2>
          <div className="support-chat-window">
            {messages.map((message, index) => (
              <div className={`support-message ${message.role}`} key={`${message.role}-${index}`}>
                {message.text}
              </div>
            ))}
          </div>
          <form className="support-chat-form" onSubmit={sendQuestion}>
            <input className="input" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Pergunte sobre uma função do LuminaAI" />
            <button className="btn primary">Enviar</button>
          </form>
        </GlassCard>
      </div>
      <div className="grid grid-2">
        <LanguagePreferenceCard />
      </div>
      <GlassCard className="support-shortcuts-card">
        <div className="glass-card-head">
          <div>
            <span className="eyebrow">Ajuda</span>
            <strong>Atalhos úteis</strong>
          </div>
        </div>
        <div className="support-shortcuts">
          <Link className="support-shortcut" href="/student/tutorial">
            <strong>Tutorial de instalação</strong>
            <small>Como colocar o app na tela inicial.</small>
          </Link>
          <Link className="support-shortcut" href="/student/settings">
            <strong>Perfil</strong>
            <small>Dados e preferências do portal do aluno.</small>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}

export function TeacherClassesPanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const [studentData, scheduleData] = await Promise.all([
        apiFetch<{ students: Student[] }>('/api/teacher/students'),
        apiFetch<{ classes: ClassSchedule[] }>('/api/teacher/schedule'),
      ]);
      setStudents(studentData.students);
      setClasses(scheduleData.classes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar turmas.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  const subjects = Array.from(new Set(students.map((student) => student.subject || 'Sem matéria')));
  const scheduled = classes.filter((item) => item.status === 'scheduled').length;

  return (
    <div className="stack portal-tab">
      <SectionIntro title="Turmas" text="Organização visual das matérias, alunos ativos e próximas aulas." />
      <StatusMessage error={error} loading={loading} />
      <div className="grid grid-3">
        <MetricCard title="Matérias" value={subjects.length} note="turmas em acompanhamento" />
        <MetricCard title="Alunos ativos" value={students.filter((student) => student.status === 'active').length} note="com agenda vinculada" />
        <MetricCard title="Aulas futuras" value={scheduled} note="pendentes na agenda" />
      </div>
      {!loading && students.length === 0 && <EmptyState title="Nenhuma turma formada" text="Cadastre alunos para montar suas turmas automaticamente." />}
      <div className="portal-card-grid">
        {subjects.map((subject) => {
          const group = students.filter((student) => (student.subject || 'Sem matéria') === subject);
          return (
            <GlassCard className="portal-summary-card" key={subject}>
              <div className="glass-card-head">
                <strong>{subject}</strong>
                <StatusBadge tone="success">{group.length} alunos</StatusBadge>
              </div>
              <div className="mini-list">
                {group.map((student) => (
                  <span key={student.id}>
                    <strong>{student.full_name}</strong>
                    <small>{student.classes_per_week || 0} aulas/semana - {student.class_time || 'sem horário'}</small>
                  </span>
                ))}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

export function TeacherGradesPanel() {
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const data = await apiFetch<{ submissions: ActivitySubmission[] }>('/api/teacher/submissions');
      setSubmissions(data.submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar notas.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  const corrected = submissions.filter((item) => item.status === 'corrected');
  const average = corrected.length ? Math.round(corrected.reduce((sum, item) => sum + Number(item.grade || 0), 0) / corrected.length) : 0;
  const byStudent = submissions.reduce<Record<string, ActivitySubmission[]>>((groups, submission) => {
    const key = submission.student_id || 'sem-aluno';
    groups[key] = groups[key] || [];
    groups[key].push(submission);
    return groups;
  }, {});

  return (
    <div className="stack portal-tab">
      <SectionIntro title="Notas" text="Acompanhe entregas corrigidas, pendentes e desempenho médio." />
      <StatusMessage error={error} loading={loading} />
      <div className="grid grid-3">
        <MetricCard title="Entregas" value={submissions.length} note="recebidas dos alunos" />
        <MetricCard title="Corrigidas" value={corrected.length} note="com nota lançada" />
        <MetricCard title="Média" value={average || '-'} note="desempenho geral" />
      </div>
      {!loading && submissions.length === 0 && <EmptyState title="Nenhuma entrega ainda" text="As respostas enviadas pelos alunos aparecem aqui." />}
      <div className="student-insight-grid">
        {Object.entries(byStudent).map(([studentId, studentSubmissions]) => {
          const studentName = studentSubmissions[0]?.students?.full_name || 'Aluno';
          const studentCorrected = studentSubmissions.filter((item) => item.status === 'corrected');
          const studentAverage = studentCorrected.length
            ? Math.round(studentCorrected.reduce((sum, item) => sum + Number(item.grade || 0), 0) / studentCorrected.length)
            : null;
          return (
            <GlassCard className="student-grade-card" key={studentId}>
              <div className="student-card-head">
                <div className="student-avatar-mini">{studentName.slice(0, 1).toUpperCase()}</div>
                <div>
                  <strong>{studentName}</strong>
                  <small>{studentSubmissions.length} atividade{studentSubmissions.length === 1 ? '' : 's'} entregue{studentSubmissions.length === 1 ? '' : 's'}</small>
                </div>
                <StatusBadge tone={studentAverage != null ? 'success' : 'warning'}>{studentAverage != null ? `Média ${studentAverage}` : 'Sem média'}</StatusBadge>
              </div>
              <div className="data-table compact-data-table">
                {studentSubmissions.map((submission) => (
                  <div className="data-row" key={submission.id}>
                    <span><strong>{submission.activities?.title || 'Atividade'}</strong><small>{submission.feedback || 'Sem feedback ainda'}</small></span>
                    <span>{submission.grade != null ? submission.grade : 'Aguardando'}</span>
                    <StatusBadge tone={statusTone(submission.status)}>{statusLabel(submission.status)}</StatusBadge>
                  </div>
                ))}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

export function TeacherFrequencyPanel() {
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const data = await apiFetch<{ classes: ClassSchedule[] }>('/api/teacher/schedule');
      setClasses(data.classes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar frequência.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  const completed = classes.filter((item) => item.status === 'completed').length;
  const absences = classes.filter((item) => item.status === 'absence').length;
  const confirmed = classes.filter((item) => item.student_confirmed).length;
  const byStudent = classes.reduce<Record<string, ClassSchedule[]>>((groups, item) => {
    const key = item.student_id || 'sem-aluno';
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});

  return (
    <div className="stack portal-tab">
      <SectionIntro title="Frequência" text="Controle presenças, faltas e confirmações de aula." />
      <StatusMessage error={error} loading={loading} />
      <div className="grid grid-3">
        <MetricCard title="Aulas realizadas" value={completed} note="marcadas como concluídas" />
        <MetricCard title="Confirmações" value={confirmed} note="confirmadas por alunos" />
        <MetricCard title="Faltas" value={absences} note="registradas na agenda" />
      </div>
      {!loading && classes.length === 0 && <EmptyState title="Sem frequência ainda" text="A frequência nasce da agenda de aulas." />}
      <div className="student-insight-grid">
        {Object.entries(byStudent).map(([studentId, studentClasses]) => {
          const studentName = studentClasses[0]?.students?.full_name || 'Aluno';
          const studentDone = studentClasses.filter((item) => item.status === 'completed').length;
          const studentAbsences = studentClasses.filter((item) => item.status === 'absence').length;
          const studentConfirmed = studentClasses.filter((item) => item.student_confirmed).length;
          return (
            <GlassCard className="student-frequency-card" key={studentId}>
              <div className="student-card-head">
                <div className="student-avatar-mini">{studentName.slice(0, 1).toUpperCase()}</div>
                <div>
                  <strong>{studentName}</strong>
                  <small>{studentDone} realizadas · {studentAbsences} faltas · {studentConfirmed} confirmadas</small>
                </div>
                <StatusBadge tone={studentAbsences > 0 ? 'warning' : 'success'}>{studentAbsences > 0 ? 'Atenção' : 'Em dia'}</StatusBadge>
              </div>
              <div className="timeline-card student-timeline">
                {studentClasses.slice(0, 8).map((item) => (
                  <div className="timeline-row" key={item.id}>
                    <span />
                    <div>
                      <strong>{item.subject || 'Aula'}</strong>
                      <small>{item.class_date} às {item.class_time}</small>
                    </div>
                    <StatusBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</StatusBadge>
                  </div>
                ))}
              </div>
            </GlassCard>
          );
        })}
      </div>
      {false && <GlassCard className="timeline-card">
        {classes.slice(0, 12).map((item) => (
          <div className="timeline-row" key={item.id}>
            <span />
            <div>
              <strong>{item.students?.full_name || 'Aluno'}</strong>
              <small>{item.class_date} às {item.class_time}</small>
            </div>
            <StatusBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</StatusBadge>
          </div>
        ))}
      </GlassCard>}
    </div>
  );
}

export function TeacherSettingsPanel() {
  const [profile, setProfile] = useState<{ full_name?: string; access_code?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const data = await apiFetch<{ profile: { full_name?: string; access_code?: string } }>('/api/teacher/profile');
      setProfile(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar configurações.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load, 30000);

  return (
    <div className="stack portal-tab">
      <SectionIntro title="Configurações" text="Dados essenciais da conta e código para vincular alunos." />
      <StatusMessage error={error} loading={loading} />
      <div className="grid grid-2">
        <GlassCard className="portal-summary-card">
          <span className="eyebrow">Professor</span>
          <h2>{profile?.full_name || 'Professor'}</h2>
          <p className="muted">Seu portal está conectado ao Supabase e sincroniza alunos, agenda e mensagens.</p>
        </GlassCard>
        <GlassCard className="portal-summary-card access-code-card">
          <span className="eyebrow">Código do professor</span>
          <h2>{profile?.access_code || '...'}</h2>
          <p className="muted">Use este código no cadastro do aluno para criar o vínculo automaticamente.</p>
        </GlassCard>
      </div>
      <div className="grid grid-2">
        <LanguagePreferenceCard />
        <TelegramSettingsCard />
      </div>
      <div className="grid grid-2">
        <PasswordChangeCard />
      </div>
      <GlassCard className="support-shortcuts-card">
        <div className="glass-card-head">
          <div>
            <span className="eyebrow">Ajuda</span>
            <strong>Atalhos úteis</strong>
          </div>
        </div>
        <div className="support-shortcuts">
          <Link className="support-shortcut" href="/teacher/tutorial">
            <strong>Tutorial de instalação</strong>
            <small>Como colocar o app na tela inicial.</small>
          </Link>
          <Link className="support-shortcut" href="/teacher/support">
            <strong>Suporte</strong>
            <small>Contato e assistente de ajuda do LuminaAI.</small>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}

function TelegramSettingsCard() {
  const [connected, setConnected] = useState(false);
  const [identity, setIdentity] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const data = await apiFetch<{
        connection: { connected: boolean; telegram_username?: string | null; telegram_first_name?: string | null };
      }>('/api/teacher/telegram');
      setConnected(Boolean(data.connection.connected));
      setIdentity(data.connection.telegram_username ? `@${data.connection.telegram_username}` : data.connection.telegram_first_name || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar Telegram.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load, 30000);

  async function disconnect() {
    setBusy(true);
    setError('');
    try {
      await apiFetch('/api/teacher/telegram', { method: 'DELETE' });
      setConnected(false);
      setIdentity('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao desconectar Telegram.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassCard className="portal-summary-card">
      <span className="eyebrow">Lumi Assistente</span>
      <h2>{connected ? 'Conectado' : 'Não conectado'}</h2>
      <p className="muted">
        {connected
          ? `Lumi Assistente vinculado ${identity ? `como ${identity}` : 'ao seu Telegram'}.`
          : 'Conecte o Lumi Assistente para organizar agenda e pagamentos pelo Telegram.'}
      </p>
      {error && <small className="error-text">{error}</small>}
      <div className="panel-actions">
        <Link className="btn primary" href="/teacher/telegram">
          {connected ? 'Gerenciar assistente' : 'Conectar assistente'}
        </Link>
        {connected && (
          <button className="btn danger" type="button" onClick={disconnect} disabled={busy || loading}>
            {busy ? 'Desconectando...' : 'Desconectar'}
          </button>
        )}
      </div>
    </GlassCard>
  );
}

export function StudentClassesPanel() {
  return <StudentScheduleSummary mode="classes" />;
}

export function StudentFrequencyPanel() {
  return <StudentScheduleSummary mode="frequency" />;
}

function StudentScheduleSummary({ mode }: { mode: 'classes' | 'frequency' }) {
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const data = await apiFetch<{ classes: ClassSchedule[] }>('/api/student/schedule');
      setClasses(data.classes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar aulas.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  const completed = classes.filter((item) => item.status === 'completed').length;
  const confirmed = classes.filter((item) => item.student_confirmed).length;
  const scheduled = classes.filter((item) => item.status === 'scheduled').length;

  return (
    <div className="stack portal-tab">
      <SectionIntro
        title={mode === 'classes' ? 'Minhas aulas' : 'Frequência'}
        text={mode === 'classes' ? 'Veja suas próximas aulas e matérias.' : 'Acompanhe presenças e confirmações.'}
      />
      <StatusMessage error={error} loading={loading} />
      <div className="grid grid-3">
        <MetricCard title="Agendadas" value={scheduled} note="próximos encontros" />
        <MetricCard title="Confirmadas" value={confirmed} note="confirmadas por você" />
        <MetricCard title="Realizadas" value={completed} note="concluídas" />
      </div>
      {!loading && classes.length === 0 && <EmptyState title="Nenhuma aula encontrada" text="Quando o professor organizar sua agenda, ela aparece aqui." />}
      <GlassCard className="timeline-card">
        {classes.slice(0, 12).map((item) => (
          <div className="timeline-row" key={item.id}>
            <span />
            <div>
              <strong>{item.subject || 'Aula'}</strong>
              <small>{item.class_date} às {item.class_time}</small>
            </div>
            <StatusBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</StatusBadge>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

export function StudentGradesPanel() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const data = await apiFetch<{ activities: Activity[]; submissions: ActivitySubmission[] }>('/api/student/activities');
      setActivities(data.activities);
      setSubmissions(data.submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar notas.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  const corrected = submissions.filter((item) => item.status === 'corrected');
  const average = corrected.length ? Math.round(corrected.reduce((sum, item) => sum + Number(item.grade || 0), 0) / corrected.length) : 0;

  return (
    <div className="stack portal-tab">
      <SectionIntro title="Notas" text="Veja notas, feedbacks e atividades ainda aguardando correção." />
      <StatusMessage error={error} loading={loading} />
      <div className="grid grid-3">
        <MetricCard title="Atividades" value={activities.length} note="publicadas" />
        <MetricCard title="Corrigidas" value={corrected.length} note="com feedback" />
        <MetricCard title="Média" value={average || '-'} note="resultado atual" />
      </div>
      {!loading && submissions.length === 0 && <EmptyState title="Sem notas ainda" text="Entregue atividades para receber correções do professor." />}
      <GlassCard className="data-table-card">
        <div className="data-table">
          {submissions.map((submission) => (
            <div className="data-row" key={submission.id}>
              <span><strong>{submission.activities?.title || 'Atividade'}</strong><small>{submission.feedback || 'Sem feedback ainda'}</small></span>
              <span>{submission.grade != null ? submission.grade : 'Aguardando'}</span>
              <StatusBadge tone={statusTone(submission.status)}>{statusLabel(submission.status)}</StatusBadge>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

export function StudentMaterialsPanel() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const data = await apiFetch<{ activities: Activity[] }>('/api/student/activities');
      setActivities(data.activities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar matériais.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  const files = activities.filter((activity) => activity.file_url);

  return (
    <div className="stack portal-tab">
      <SectionIntro title="Materiais" text="Arquivos enviados pelo professor ficam reunidos aqui." />
      <StatusMessage error={error} loading={loading} />
      <div className="grid grid-3">
        <MetricCard title="Arquivos" value={files.length} note="disponíveis" />
        <MetricCard title="Matérias" value={new Set(activities.map((activity) => activity.subject || 'Geral')).size} note="com conteúdo" />
        <MetricCard title="Atividades" value={activities.length} note="vinculadas" />
      </div>
      {!loading && files.length === 0 && <EmptyState title="Nenhum matérial ainda" text="Quando o professor anexar arquivos, eles aparecem aqui." />}
      <div className="portal-card-grid">
        {files.map((activity) => (
          <GlassCard className="portal-summary-card" key={activity.id}>
            <div className="glass-card-head">
              <strong>{activity.title}</strong>
              <StatusBadge tone="warning">{activity.subject || 'Geral'}</StatusBadge>
            </div>
            <p className="muted">{activity.description || 'Material da atividade.'}</p>
            <a className="file-link" href={activity.file_url || '#'} target="_blank">Abrir matérial</a>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

export function StudentSettingsPanel() {
  const [student, setStudent] = useState<Student | null>(null);
  const [inviteToken, setInviteToken] = useState('');
  const [inviteSaving, setInviteSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() {
    try {
      setError('');
      const data = await apiFetch<{ student: Student }>('/api/student/me');
      setStudent(data.student);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar perfil.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load, 30000);

  const days = useMemo(() => (student?.days_of_week || []).join(', ') || 'Não definido', [student]);

  async function acceptInvite() {
    if (!inviteToken.trim()) return;
    setInviteSaving(true);
    setError('');
    setSuccess('');
    try {
      await apiFetch('/api/student/invites/accept', {
        method: 'POST',
        body: JSON.stringify({ invite_token: inviteToken.trim() }),
      });
      setInviteToken('');
      setSuccess('Professor vinculado com sucesso.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao vincular professor.');
    } finally {
      setInviteSaving(false);
    }
  }

  return (
    <div className="stack portal-tab">
      <SectionIntro title="Perfil" text="Informações do seu cadastro e vínculo com o professor." />
      <StatusMessage error={error} loading={loading} />
      <div className="grid grid-2">
        <GlassCard className="portal-summary-card">
          <span className="eyebrow">Aluno</span>
          <h2>{student?.full_name || 'Aluno'}</h2>
          <p className="muted">{student?.email || 'E-mail não informado'}</p>
          <StatusBadge tone={statusTone(student?.status)}>{statusLabel(student?.status) || 'Ativo'}</StatusBadge>
        </GlassCard>
        <GlassCard className="portal-summary-card">
          <span className="eyebrow">Aulas</span>
          <h2>{student?.subject || 'Matéria não definida'}</h2>
          <p className="muted">Dias: {days}</p>
          <p className="muted">Horário: {student?.class_time || 'Não definido'}</p>
        </GlassCard>
      </div>
      <div className="grid grid-2">
        <LanguagePreferenceCard />
        <PasswordChangeCard />
        <GlassCard className="portal-summary-card">
          <span className="eyebrow">Novo professor</span>
          <h2>Vincular convite</h2>
          <p className="muted">Cole o token do convite ou abra o link enviado pelo professor para conectar esta conta a outra aula.</p>
          {success && <p className="success">{success}</p>}
          <label className="label">Token do convite<input className="input" value={inviteToken} onChange={(event) => setInviteToken(event.target.value)} placeholder="Cole o código do link recebido" /></label>
          <button className="flow-login-button" type="button" onClick={acceptInvite} disabled={inviteSaving || !inviteToken.trim()}>{inviteSaving ? 'Vinculando...' : 'Vincular professor'}</button>
        </GlassCard>
      </div>
    </div>
  );
}
