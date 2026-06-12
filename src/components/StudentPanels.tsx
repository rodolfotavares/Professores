'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/fetcher';
import type { Activity, ActivitySubmission, ClassSchedule, Message, Student } from '@/types';

export function StudentDashboard() {
  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);

  useEffect(() => {
    Promise.all([
      apiFetch<{ student: Student }>('/api/student/me'),
      apiFetch<{ classes: ClassSchedule[] }>('/api/student/schedule'),
      apiFetch<{ activities: Activity[]; submissions: ActivitySubmission[] }>('/api/student/activities'),
    ]).then(([me, schedule, activityData]) => {
      setStudent(me.student);
      setClasses(schedule.classes);
      setActivities(activityData.activities);
      setSubmissions(activityData.submissions);
    });
  }, []);

  const pending = activities.filter((activity) => !submissions.some((submission) => submission.activity_id === activity.id));

  return (
    <div className="grid grid-3">
      <div className="card"><p className="muted">Aluno</p><h2>{student?.full_name || '...'}</h2></div>
      <div className="card"><p className="muted">Aulas</p><h2>{classes.length}</h2></div>
      <div className="card"><p className="muted">Pendentes</p><h2>{pending.length}</h2></div>
    </div>
  );
}

export function StudentSchedulePanel() {
  const [classes, setClasses] = useState<ClassSchedule[]>([]);

  async function load() {
    const data = await apiFetch<{ classes: ClassSchedule[] }>('/api/student/schedule');
    setClasses(data.classes);
  }

  useEffect(() => { load(); }, []);

  async function confirm(id: string) {
    await apiFetch(`/api/student/schedule/${id}/confirm`, { method: 'PATCH' });
    await load();
  }

  return (
    <div className="stack">
      {classes.map((item) => (
        <div className="card row between" key={item.id}>
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

  async function load() {
    const data = await apiFetch<{ activities: Activity[]; submissions: ActivitySubmission[] }>('/api/student/activities');
    setActivities(data.activities);
    setSubmissions(data.submissions);
  }

  useEffect(() => { load(); }, []);

  async function submit(activityId: string) {
    await apiFetch(`/api/student/activities/${activityId}/submit`, { method: 'POST', body: JSON.stringify({ answer_text: answer || 'Entregue' }) });
    setAnswer('');
    await load();
  }

  return (
    <div className="stack">
      <textarea className="input" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Resposta da atividade" />
      {activities.map((activity) => {
        const submission = submissions.find((item) => item.activity_id === activity.id);
        return (
          <div className="card row between" key={activity.id}>
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

  async function load() {
    const me = await apiFetch<{ student: Student }>('/api/student/me');
    setStudent(me.student);
    const data = await apiFetch<{ messages: Message[] }>(`/api/messages?student_id=${me.student.id}`);
    setMessages(data.messages);
  }

  useEffect(() => { load(); }, []);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!student) return;
    await apiFetch('/api/messages', { method: 'POST', body: JSON.stringify({ student_id: student.id, text }) });
    setText('');
    await load();
  }

  return (
    <div className="grid grid-2">
      <form className="card stack" onSubmit={send}>
        <h2>Enviar recado</h2>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Digite um recado" />
        <button className="btn student">Enviar</button>
      </form>
      <div className="stack">{messages.map((message) => <div className="card" key={message.id}><span className="badge">{message.sender_role}</span><p>{message.text}</p></div>)}</div>
    </div>
  );
}
