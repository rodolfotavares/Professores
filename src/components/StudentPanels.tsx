'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/fetcher';
import { EmptyState, StatusMessage } from '@/components/PanelState';
import type { Activity, ActivitySubmission, ClassSchedule, Message, Student } from '@/types';

function usePanelLoad(load: () => Promise<void>, interval = 15000) {
  useEffect(() => {
    load();
    const timer = window.setInterval(load, interval);
    return () => window.clearInterval(timer);
  }, []);
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
      <StatusMessage error={error} loading={loading} />
      <div className="grid grid-3">
        <div className="metric"><p className="muted">Aluno</p><h2>{student?.full_name || '...'}</h2></div>
        <div className="metric"><p className="muted">Aulas</p><h2>{classes.length}</h2></div>
        <div className="metric"><p className="muted">Pendentes</p><h2>{pending.length}</h2></div>
      </div>
      <div className="panel-note">Agenda, atividades e recados atualizam automaticamente.</div>
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

  async function confirm(id: string) {
    await apiFetch(`/api/student/schedule/${id}/confirm`, { method: 'PATCH' });
    await load();
  }

  return (
    <div className="stack">
      <StatusMessage error={error} loading={loading} />
      {!loading && classes.length === 0 && <EmptyState title="Nenhuma aula agendada" text="Quando o professor criar aulas, elas aparecem aqui." />}
      {classes.map((item) => (
        <div className="card list-item" key={item.id}>
          <div><strong>{item.subject || 'Aula'}</strong><p className="muted">{item.class_date} as {item.class_time} - {item.status}</p></div>
          {item.student_confirmed ? <span className="badge">Confirmada</span> : <button className="btn student" onClick={() => confirm(item.id)}>Confirmar</button>}
        </div>
      ))}
    </div>
  );
}

export function StudentActivitiesPanel() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);
  const [answer, setAnswer] = useState('');
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
    await apiFetch(`/api/student/activities/${activityId}/submit`, { method: 'POST', body: JSON.stringify({ answer_text: answer || 'Entregue' }) });
    setAnswer('');
    await load();
  }

  return (
    <div className="stack">
      <StatusMessage error={error} loading={loading} />
      <textarea className="input textarea" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Resposta da atividade" />
      {!loading && activities.length === 0 && <EmptyState title="Nenhuma atividade" text="Quando o professor publicar atividades, elas aparecem aqui." />}
      {activities.map((activity) => {
        const submission = submissions.find((item) => item.activity_id === activity.id);
        return (
          <div className="card list-item" key={activity.id}>
            <div>
              <strong>{activity.title}</strong>
              <p className="muted">{activity.description}</p>
              {submission?.grade != null && <p className="success">Nota: {submission.grade} - {submission.feedback}</p>}
            </div>
            {submission ? <span className="badge">{submission.status}</span> : <button className="btn student" onClick={() => submit(activity.id)}>Entregar</button>}
          </div>
        );
      })}
    </div>
  );
}

export function StudentMessagesPanel() {
  const [student, setStudent] = useState<Student | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
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
    if (!student || !text.trim()) return;
    await apiFetch('/api/messages', { method: 'POST', body: JSON.stringify({ student_id: student.id, text }) });
    setText('');
    await load();
  }

  return (
    <div className="grid grid-2">
      <form className="card stack" onSubmit={send}>
        <h2>Enviar recado</h2>
        <StatusMessage error={error} loading={loading} />
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Digite um recado" />
        <button className="btn student" disabled={!student}>Enviar</button>
      </form>
      <div className="stack">
        {!loading && messages.length === 0 && <EmptyState title="Sem recados" text="As mensagens do professor aparecem aqui." />}
        {messages.map((message) => <div className="card" key={message.id}><span className="badge">{message.sender_role}</span><p>{message.text}</p></div>)}
      </div>
    </div>
  );
}
