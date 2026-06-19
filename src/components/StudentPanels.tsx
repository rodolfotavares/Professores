'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/fetcher';
import { EmptyState, StatusMessage } from '@/components/PanelState';
import { MessageThread } from '@/components/MessageThread';
import type { Activity, ActivitySubmission, ClassSchedule, Message, Student } from '@/types';

function usePanelLoad(load: () => Promise<void>, interval = 15000) {
  useEffect(() => {
    load();
    const timer = window.setInterval(load, interval);
    return () => window.clearInterval(timer);
  }, []);
}

async function uploadFile(file: File) {
  const body = new FormData();
  body.append('file', file);
  return apiFetch<{ url: string }>('/api/upload', { method: 'POST', body });
}

function PanelHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="panel-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      <p>{text}</p>
    </div>
  );
}

function statusLabel(status?: string) {
  const labels: Record<string, string> = {
    scheduled: 'Agendada',
    completed: 'Realizada',
    cancelled: 'Cancelada',
    absence: 'Falta',
    pending: 'Pendente',
    submitted: 'Enviada',
    corrected: 'Corrigida',
    active: 'Ativo',
    paused: 'Pausado',
    inactive: 'Inativo',
  };
  return status ? labels[status] || status : '';
}

function formatDate(date?: string) {
  if (!date) return 'Data não definida';
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date(`${date}T00:00:00`));
}

function shortDateParts(date?: string) {
  if (!date) return { day: '--', month: '---' };
  const parsed = new Date(`${date}T00:00:00`);
  return {
    day: new Intl.DateTimeFormat('pt-BR', { day: '2-digit' }).format(parsed),
    month: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(parsed).replace('.', ''),
  };
}

export function StudentDashboard() {
  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const [me, schedule, activityData] = await Promise.all([
        apiFetch<{ student: Student }>('/api/student/me'),
        apiFetch<{ classes: ClassSchedule[] }>('/api/student/schedule'),
        apiFetch<{ activities: Activity[]; submissions: ActivitySubmission[] }>('/api/student/activities'),
      ]);
      setStudent(me.student);
      setClasses(schedule.classes);
      setActivities(activityData.activities);
      setSubmissions(activityData.submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar painel.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  const pending = activities.filter((activity) => !submissions.some((submission) => submission.activity_id === activity.id));

  return (
    <div className="stack">
      <PanelHeader eyebrow="Início" title="Portal do Aluno" text="Veja suas aulas, tarefas e recados em um só lugar." />
      <StatusMessage error={error} loading={loading} />
      <div className="grid grid-3">
        <div className="metric"><p className="muted">Aluno</p><h2>{student?.full_name || '...'}</h2></div>
        <div className="metric"><p className="muted">Aulas</p><h2>{classes.length}</h2></div>
        <div className="metric"><p className="muted">Pendentes</p><h2>{pending.length}</h2></div>
      </div>
    </div>
  );
}

export function StudentSchedulePanel() {
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const data = await apiFetch<{ classes: ClassSchedule[] }>('/api/student/schedule');
      setClasses(data.classes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar agenda.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  const sortedClasses = [...classes].sort((a, b) => `${a.class_date} ${a.class_time}`.localeCompare(`${b.class_date} ${b.class_time}`));
  const nextClass = sortedClasses.find((item) => item.status === 'scheduled') || sortedClasses[0];
  const confirmed = classes.filter((item) => item.student_confirmed).length;
  const scheduled = classes.filter((item) => item.status === 'scheduled').length;
  const groupedClasses = sortedClasses.reduce<Record<string, ClassSchedule[]>>((groups, item) => {
    const key = item.class_date || 'sem-data';
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});

  async function confirm(id: string) {
    await apiFetch(`/api/student/schedule/${id}/confirm`, { method: 'PATCH' });
    await load();
  }

  return (
    <div className="stack">
      <PanelHeader eyebrow="Calendário" title="Agenda" text="Veja exatamente quando suas aulas acontecerão." />
      <StatusMessage error={error} loading={loading} />
      <div className="grid grid-3">
        <div className="metric"><p className="muted">Aulas agendadas</p><h2>{scheduled}</h2></div>
        <div className="metric"><p className="muted">Confirmadas</p><h2>{confirmed}</h2></div>
        <div className="metric"><p className="muted">Próxima aula</p><h2>{nextClass?.class_time || '--:--'}</h2></div>
      </div>
      {!loading && classes.length === 0 && <EmptyState title="Nenhuma aula agendada" text="Quando o professor criar aulas, elas aparecem aqui." />}
      <div className="student-agenda">
        {Object.entries(groupedClasses).map(([date, items]) => (
          <section className="agenda-day-group card" key={date}>
            <div className="agenda-day-title">
              <span>{formatDate(date)}</span>
              <small>{items.length} aula{items.length > 1 ? 's' : ''}</small>
            </div>
            {items.map((item) => {
              const parts = shortDateParts(item.class_date);
              return (
                <div className="agenda-class-row" key={item.id}>
                  <div className="agenda-date-pill">
                    <strong>{parts.day}</strong>
                    <span>{parts.month}</span>
                  </div>
                  <div className="agenda-class-info">
                    <strong>{item.subject || 'Aula'}</strong>
                    <p>{item.class_time || 'Horário não definido'} · {statusLabel(item.status)}</p>
                  </div>
                  {item.student_confirmed ? <span className="badge">Confirmada</span> : <button className="btn student" onClick={() => confirm(item.id)}>Confirmar presença</button>}
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}

export function StudentActivitiesPanel() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);
  const [expandedId, setExpandedId] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [savingId, setSavingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const data = await apiFetch<{ activities: Activity[]; submissions: ActivitySubmission[] }>('/api/student/activities');
      setActivities(data.activities);
      setSubmissions(data.submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar atividades.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  async function submit(activityId: string) {
    setSavingId(activityId);
    setError('');
    try {
      const answer = answers[activityId] || '';
      const file = files[activityId] || null;
      const uploaded = file ? await uploadFile(file) : null;
      await apiFetch(`/api/student/activities/${activityId}/submit`, { method: 'POST', body: JSON.stringify({ answer_text: answer || 'Entregue', answer_file_url: uploaded?.url }) });
      setAnswers((current) => ({ ...current, [activityId]: '' }));
      setFiles((current) => ({ ...current, [activityId]: null }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao entregar atividade.');
    } finally {
      setSavingId('');
    }
  }

  const activityStats = activities.reduce(
    (stats, activity) => {
      const submission = submissions.find((item) => item.activity_id === activity.id);
      const expired = !submission && activity.due_date ? new Date() > new Date(`${activity.due_date}T23:59:59`) : false;
      if (submission) return { ...stats, completed: stats.completed + 1 };
      if (expired) return { ...stats, expired: stats.expired + 1 };
      return { ...stats, pending: stats.pending + 1 };
    },
    { pending: 0, completed: 0, expired: 0 },
  );

  return (
    <div className="stack">
      <PanelHeader eyebrow="Tarefas" title="Atividades" text="Abra uma tarefa para responder e anexar arquivos." />
      <StatusMessage error={error} loading={loading} />
      <ActivityChart pending={activityStats.pending} completed={activityStats.completed} expired={activityStats.expired} />
      {!loading && activities.length === 0 && <EmptyState title="Nenhuma atividade" text="Quando o professor publicar atividades, elas aparecem aqui." />}
      {activities.map((activity) => {
        const submission = submissions.find((item) => item.activity_id === activity.id);
        const expanded = expandedId === activity.id;
        const expired = !submission && activity.due_date ? new Date() > new Date(`${activity.due_date}T23:59:59`) : false;
        return (
          <div className={`card activity-task ${expanded ? 'expanded' : ''}`} key={activity.id}>
            <button className="activity-task-head" type="button" onClick={() => setExpandedId(expanded ? '' : activity.id)}>
              <span>
                <strong>{activity.title}</strong>
                <small>{activity.subject || 'Atividade'} {activity.due_date ? `- prazo ${activity.due_date}` : '- sem prazo'}</small>
              </span>
              <span className="row">
                <span className="badge">{submission ? statusLabel(submission.status) : expired ? 'Expirada' : 'Pendente'}</span>
                <span className="activity-chevron">{expanded ? 'Fechar' : 'Abrir'}</span>
              </span>
            </button>
            {expanded && (
              <div className="activity-task-body">
                <p className="muted">{activity.description}</p>
                {activity.file_url && <a className="file-link" href={activity.file_url} target="_blank">Abrir arquivo da atividade</a>}
                {submission ? (
                  <div className="panel-note">
                    <strong>Entrega enviada.</strong>
                    <p>{submission.answer_text || 'Sem texto enviado.'}</p>
                    {submission.answer_file_url && <a className="file-link" href={submission.answer_file_url} target="_blank">Arquivo enviado</a>}
                    {submission.grade != null && <p className="success">Nota: {submission.grade} - {submission.feedback}</p>}
                  </div>
                ) : (
                  <div className="stack">
                    <label className="label">Resposta<textarea className="input textarea" value={answers[activity.id] || ''} onChange={(e) => setAnswers((current) => ({ ...current, [activity.id]: e.target.value }))} placeholder="Digite sua resposta aqui" /></label>
                    <label className="label">Arquivo da resposta<input className="input" type="file" onChange={(e) => setFiles((current) => ({ ...current, [activity.id]: e.target.files?.[0] || null }))} /></label>
                    <button className="btn student" disabled={savingId === activity.id} onClick={() => submit(activity.id)}>{savingId === activity.id ? 'Enviando...' : 'Entregar atividade'}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ActivityChart({ pending, completed, expired }: { pending: number; completed: number; expired: number }) {
  const total = pending + completed + expired;
  const completedDeg = total ? (completed / total) * 360 : 0;
  const pendingDeg = total ? (pending / total) * 360 : 0;
  const chartStyle = {
    background: total
      ? `conic-gradient(#084eb8 0 ${completedDeg}deg, #0d6efd ${completedDeg}deg ${completedDeg + pendingDeg}deg, #8bbcff ${completedDeg + pendingDeg}deg 360deg)`
      : 'conic-gradient(#d7e4f7 0 360deg)',
  };

  return (
    <div className="card activity-chart">
      <div className="chart-donut" style={chartStyle}>
        <div>
          <strong>{total}</strong>
          <span>tarefas</span>
        </div>
      </div>
      <div className="chart-summary">
        <span className="eyebrow">Resumo das atividades</span>
        <h2>Progresso das tarefas</h2>
        <div className="chart-legend">
          <ChartLegend label="Concluídas" value={completed} tone="strong" />
          <ChartLegend label="Pendentes" value={pending} tone="main" />
          <ChartLegend label="Expiradas" value={expired} tone="soft" />
        </div>
      </div>
    </div>
  );
}

function ChartLegend({ label, value, tone }: { label: string; value: number; tone: 'strong' | 'main' | 'soft' }) {
  return (
    <div className="chart-legend-item">
      <span className={`chart-dot ${tone}`} />
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}

export function StudentMessagesPanel() {
  const [student, setStudent] = useState<Student | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const me = await apiFetch<{ student: Student }>('/api/student/me');
      setStudent(me.student);
      const data = await apiFetch<{ messages: Message[] }>(`/api/messages?student_id=${me.student.id}`);
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar recados.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!student || (!text.trim() && !file)) return;
    setSending(true);
    setError('');
    try {
      const uploaded = file ? await uploadFile(file) : null;
      await apiFetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          student_id: student.id,
          text,
          attachment_url: uploaded?.url,
          attachment_name: file?.name,
          attachment_type: file?.type,
        }),
      });
      setText('');
      setFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar recado.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="stack">
      <PanelHeader eyebrow="Comunicação" title="Recados" text="Envie mensagens e acompanhe respostas do professor." />
      <div className="grid grid-2">
      <form className="card stack message-composer-card" onSubmit={send}>
        <h2>Enviar recado</h2>
        <StatusMessage error={error} loading={loading} />
        <textarea className="input textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="Digite um recado" />
        <label className="message-file-picker">
          <span>{file ? file.name : 'Foto, vídeo ou arquivo'}</span>
          <input type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        <button className="btn student" disabled={!student || sending}>{sending ? 'Enviando...' : 'Enviar'}</button>
      </form>
      <div className="stack">
        {!loading && messages.length === 0 && <EmptyState title="Sem recados" text="As mensagens do professor aparecem aqui." />}
        <MessageThread messages={messages} currentRole="student" />
      </div>
      </div>
    </div>
  );
}
