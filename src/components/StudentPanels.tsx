'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/fetcher';
import { EmptyState, StatusMessage } from '@/components/PanelState';
import { MessageThread } from '@/components/MessageThread';
import { downloadScheduleIcs, requestReminderPermission } from '@/lib/calendar-export';
import type { Activity, ActivitySubmission, ClassSchedule, LessonReport, Message, Student } from '@/types';

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
      <div className="row">
        <button className="btn student" onClick={() => downloadScheduleIcs(classes, 'agenda-lumina-aluno.ics', 'Aluno')}>Exportar agenda</button>
        <button className="btn student" onClick={requestReminderPermission}>Ativar lembretes</button>
      </div>
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

function reportSubject(report: LessonReport) {
  return report.class_schedules?.subject || report.students?.subject || 'Aula';
}

function scoreOfReport(report: LessonReport, index: number) {
  if (typeof report.learning_score === 'number') return Math.max(0, Math.min(100, report.learning_score));
  const text = `${report.learning_progress || ''} ${report.reinforcement_points || ''}`.toLowerCase();
  if (text.includes('dificuldade recorrente')) return Math.max(25, 56 - index * 3);
  if (text.includes('duvida') || text.includes('dificuldade')) return 58;
  return Math.min(86, 64 + index * 4);
}

function StudentActivitiesEvolution({ reports, pending, completed, expired }: { reports: LessonReport[]; pending: number; completed: number; expired: number }) {
  const chronological = useMemo(() => [...reports]
    .sort((a, b) => new Date(a.published_at || a.updated_at).getTime() - new Date(b.published_at || b.updated_at).getTime())
    .slice(-12), [reports]);
  const points = chronological.map((report, index) => ({
    report,
    score: scoreOfReport(report, index),
    x: chronological.length === 1 ? 50 : (index / (chronological.length - 1)) * 100,
    y: 100 - scoreOfReport(report, index),
  }));
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
  const last = points[points.length - 1];
  const previous = points[points.length - 2];
  const delta = last && previous ? last.score - previous.score : 0;
  const subjectCount = new Set(reports.map(reportSubject)).size;
  const reinforcementCount = reports.filter((report) => `${report.learning_progress || ''} ${report.reinforcement_points || ''}`.toLowerCase().includes('dificuldade')).length;
  const completionRate = pending + completed + expired ? Math.round((completed / (pending + completed + expired)) * 100) : 0;
  const participation = pending + completed + expired ? Math.round(((completed + pending * 0.45) / (pending + completed + expired)) * 100) : 0;

  return (
    <section className="student-activity-evolution">
      <div className="student-evolution-title">
        <div>
          <h1>Evolução do aluno <span>IA</span></h1>
          <p>Análise inteligente baseada nos relatórios de aula e nas atividades.</p>
        </div>
      </div>
      <div className="student-evolution-kpis">
        <article className="student-profile-kpi">
          <span>AB</span>
          <div>
            <strong>{reports[0]?.students?.full_name || 'Aluno'}</strong>
            <p>Matérias acompanhadas: {subjectCount || 0}</p>
            <small>Total de aulas analisadas: {reports.length}</small>
          </div>
        </article>
        <article><small>Evolução geral</small><strong>{last ? `${last.score}%` : '--'}</strong><p>{delta >= 0 ? 'Evolução positiva' : 'Queda por dúvida recorrente'}</p></article>
        <article><small>Participação</small><strong>{participation}%</strong><p>Interação com tarefas</p></article>
        <article><small>Tarefas entregues</small><strong>{completionRate}%</strong><p>Entregas registradas</p></article>
        <article><small>Pontos para reforçar</small><strong>{reinforcementCount}</strong><p>Habilidades com atenção</p></article>
      </div>
      <div className="student-evolution-layout">
        <article className="student-evolution-main-chart">
          <div className="chart-panel-head">
            <div>
              <h2>Evolução geral ao longo do tempo</h2>
              <p>Pontuação de domínio por aula (0 a 100)</p>
            </div>
            <select value="12" aria-label="Filtro de aulas" onChange={() => undefined}>
              <option>Últimas 12 aulas</option>
            </select>
          </div>
          {points.length ? (
            <svg viewBox="0 0 100 56" preserveAspectRatio="none" aria-label="Gráfico de evolução">
              <path className="chart-grid" d="M0 8 H100 M0 20 H100 M0 32 H100 M0 44 H100" />
              <path className="chart-area" d={`${path} L 100 56 L 0 56 Z`} />
              <path className="chart-line" d={path} />
              {points.map((point, index) => (
                <g key={point.report.id}>
                  <circle cx={point.x} cy={point.y * 0.56} r="1.6" />
                  <text x={point.x} y={Math.max(5, point.y * 0.56 - 4)}>{point.score}</text>
                  <text className="chart-label" x={point.x} y="54">{`Aula ${index + 1}`}</text>
                </g>
              ))}
            </svg>
          ) : (
            <div className="empty-smart-editor"><h2>Sem evolução ainda</h2><p>Quando o professor publicar relatórios, o gráfico aparecerá aqui.</p></div>
          )}
        </article>
        <article className="student-ai-analysis">
          <h2>Análise da IA</h2>
          <div>
            <p>{last?.report.learning_evidence || 'A IA ainda precisa de relatórios publicados para medir a evolução com sinceridade.'}</p>
            <strong>Critério de leitura:</strong>
            <ul>
              <li>Dúvidas recorrentes reduzem a pontuação.</li>
              <li>Dúvidas que desaparecem aumentam a evolução.</li>
              <li>Novas dúvidas deixam a análise mais cautelosa.</li>
            </ul>
          </div>
        </article>
      </div>
    </section>
  );
}

export function StudentActivitiesPanel() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);
  const [reports, setReports] = useState<LessonReport[]>([]);
  const [expandedId, setExpandedId] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [savingId, setSavingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const [data, reportData] = await Promise.all([
        apiFetch<{ activities: Activity[]; submissions: ActivitySubmission[] }>('/api/student/activities'),
        apiFetch<{ reports: LessonReport[] }>('/api/student/lesson-reports'),
      ]);
      setActivities(data.activities);
      setSubmissions(data.submissions);
      setReports(reportData.reports);
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
      <StudentActivitiesEvolution reports={reports} pending={activityStats.pending} completed={activityStats.completed} expired={activityStats.expired} />
      {!loading && activities.length === 0 && <EmptyState title="Nenhuma atividade" text="Quando o professor publicar atividades, elas aparecem aqui." />}
      <section className="student-activities-workspace">
        <div className="student-activities-title">
          <div>
            <h2>Atividades</h2>
            <p>Abra uma tarefa para ler, responder, editar sua resposta e anexar arquivos.</p>
          </div>
          <span>{activities.length} tarefa{activities.length === 1 ? '' : 's'}</span>
        </div>
      {activities.map((activity) => {
        const submission = submissions.find((item) => item.activity_id === activity.id);
        const expanded = expandedId === activity.id;
        const expired = !submission && activity.due_date ? new Date() > new Date(`${activity.due_date}T23:59:59`) : false;
        return (
          <div className={`card activity-task student-activity-expand ${expanded ? 'expanded' : ''}`} key={activity.id}>
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
                    <label className="label">Resposta<textarea className="input textarea" value={answers[activity.id] || ''} onChange={(e) => setAnswers((current) => ({ ...current, [activity.id]: e.target.value }))} placeholder="Escreva sua resposta com calma. Você pode editar antes de entregar." /></label>
                    <label className="label">Arquivo da resposta<input className="input" type="file" onChange={(e) => setFiles((current) => ({ ...current, [activity.id]: e.target.files?.[0] || null }))} /></label>
                    <button className="btn student" disabled={savingId === activity.id} onClick={() => submit(activity.id)}>{savingId === activity.id ? 'Enviando...' : 'Entregar atividade'}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      </section>
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
