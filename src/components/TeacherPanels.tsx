'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/fetcher';
import type { Activity, ActivitySubmission, ClassSchedule, Message, Student } from '@/types';

export function TeacherDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    Promise.all([
      apiFetch<{ students: Student[] }>('/api/teacher/students'),
      apiFetch<{ classes: ClassSchedule[] }>('/api/teacher/schedule'),
      apiFetch<{ activities: Activity[] }>('/api/teacher/activities'),
    ]).then(([s, c, a]) => {
      setStudents(s.students);
      setClasses(c.classes);
      setActivities(a.activities);
    });
  }, []);

  return (
    <div className="grid grid-3">
      <Stat title="Alunos" value={students.length} />
      <Stat title="Aulas" value={classes.length} />
      <Stat title="Atividades" value={activities.length} />
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return <div className="card"><p className="muted">{title}</p><h2>{value}</h2></div>;
}

export function StudentsPanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState({ full_name: '', email: '', whatsapp: '', subject: '', days_of_week: '1,3', class_time: '14:00' });

  async function load() {
    const data = await apiFetch<{ students: Student[] }>('/api/teacher/students');
    setStudents(data.students);
  }

  useEffect(() => { load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await apiFetch('/api/teacher/students', { method: 'POST', body: JSON.stringify({ ...form, duration_minutes: 60 }) });
    setForm({ full_name: '', email: '', whatsapp: '', subject: '', days_of_week: '1,3', class_time: '14:00' });
    await load();
  }

  return (
    <div className="grid grid-2">
      <form className="card stack" onSubmit={submit}>
        <h2>Novo aluno</h2>
        <Input label="Nome" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
        <Input label="E-mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Input label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
        <Input label="Materia" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} />
        <Input label="Dias da semana (0 dom, 1 seg...)" value={form.days_of_week} onChange={(v) => setForm({ ...form, days_of_week: v })} />
        <Input label="Horario" type="time" value={form.class_time} onChange={(v) => setForm({ ...form, class_time: v })} />
        <button className="btn primary">Salvar</button>
      </form>
      <div className="stack">
        {students.map((student) => (
          <div className="card" key={student.id}>
            <strong>{student.full_name}</strong>
            <p className="muted">{student.email} - {student.subject || 'Sem materia'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeacherSchedulePanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [form, setForm] = useState({ student_id: '', class_date: new Date().toISOString().slice(0, 10), class_time: '14:00' });

  async function load() {
    const [s, c] = await Promise.all([
      apiFetch<{ students: Student[] }>('/api/teacher/students'),
      apiFetch<{ classes: ClassSchedule[] }>('/api/teacher/schedule'),
    ]);
    setStudents(s.students);
    setClasses(c.classes);
    if (!form.student_id && s.students[0]) setForm((current) => ({ ...current, student_id: s.students[0].id }));
  }

  useEffect(() => { load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await apiFetch('/api/teacher/schedule', { method: 'POST', body: JSON.stringify({ ...form, duration_minutes: 60 }) });
    await load();
  }

  async function updateStatus(id: string, status: string) {
    await apiFetch(`/api/teacher/schedule/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await load();
  }

  return (
    <div className="grid grid-2">
      <form className="card stack" onSubmit={submit}>
        <h2>Agendar aula</h2>
        <label className="label">Aluno<select className="input" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}>{students.map((s) => <option value={s.id} key={s.id}>{s.full_name}</option>)}</select></label>
        <Input label="Data" type="date" value={form.class_date} onChange={(v) => setForm({ ...form, class_date: v })} />
        <Input label="Horario" type="time" value={form.class_time} onChange={(v) => setForm({ ...form, class_time: v })} />
        <button className="btn primary">Agendar</button>
      </form>
      <div className="stack">
        {classes.map((item) => (
          <div className="card" key={item.id}>
            <strong>{item.students?.full_name || item.student_id}</strong>
            <p className="muted">{item.class_date} as {item.class_time} - {item.status}</p>
            <div className="row">
              <button className="btn" onClick={() => updateStatus(item.id, 'completed')}>Realizada</button>
              <button className="btn" onClick={() => updateStatus(item.id, 'cancelled')}>Cancelar</button>
              <button className="btn" onClick={() => updateStatus(item.id, 'absence')}>Falta</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeacherActivitiesPanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);
  const [form, setForm] = useState({ title: '', description: '', subject: '', student_id: '', due_date: '' });
  const [grade, setGrade] = useState('10');

  async function load() {
    const [s, a, delivered] = await Promise.all([
      apiFetch<{ students: Student[] }>('/api/teacher/students'),
      apiFetch<{ activities: Activity[] }>('/api/teacher/activities'),
      apiFetch<{ submissions: ActivitySubmission[] }>('/api/teacher/submissions'),
    ]);
    setStudents(s.students);
    setActivities(a.activities);
    setSubmissions(delivered.submissions);
  }

  useEffect(() => { load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await apiFetch('/api/teacher/activities', { method: 'POST', body: JSON.stringify({ ...form, points: 10, student_id: form.student_id || undefined }) });
    setForm({ title: '', description: '', subject: '', student_id: '', due_date: '' });
    await load();
  }

  async function correct(id: string) {
    await apiFetch(`/api/teacher/submissions/${id}/correct`, { method: 'PATCH', body: JSON.stringify({ grade: Number(grade), feedback: 'Corrigida pelo professor' }) });
    await load();
  }

  return (
    <div className="grid grid-2">
      <form className="card stack" onSubmit={submit}>
        <h2>Nova atividade</h2>
        <Input label="Titulo" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <label className="label">Descricao<textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <Input label="Materia" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} />
        <label className="label">Aluno<select className="input" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}><option value="">Todos</option>{students.map((s) => <option value={s.id} key={s.id}>{s.full_name}</option>)}</select></label>
        <Input label="Prazo" type="date" value={form.due_date} onChange={(v) => setForm({ ...form, due_date: v })} />
        <button className="btn primary">Criar</button>
      </form>
      <div className="stack">
        {activities.map((activity) => (
          <div className="card" key={activity.id}>
            <strong>{activity.title}</strong>
            <p className="muted">{activity.students?.full_name || 'Todos'} - {activity.status}</p>
          </div>
        ))}
        {submissions.map((submission) => (
          <div className="card" key={submission.id}>
            <strong>{submission.activities?.title}</strong>
            <p className="muted">{submission.students?.full_name || 'Aluno'} - {submission.status}</p>
            <p>{submission.answer_text}</p>
            <Input label="Nota" value={grade} onChange={setGrade} />
            <button className="btn primary" onClick={() => correct(submission.id)}>Corrigir</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeacherMessagesPanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');

  async function load(nextStudentId = studentId) {
    const studentsData = await apiFetch<{ students: Student[] }>('/api/teacher/students');
    setStudents(studentsData.students);
    const selected = nextStudentId || studentsData.students[0]?.id || '';
    setStudentId(selected);
    if (selected) {
      const data = await apiFetch<{ messages: Message[] }>(`/api/messages?student_id=${selected}`);
      setMessages(data.messages);
    }
  }

  useEffect(() => { load(); }, []);

  async function send(event: FormEvent) {
    event.preventDefault();
    await apiFetch('/api/messages', { method: 'POST', body: JSON.stringify({ student_id: studentId, text }) });
    setText('');
    await load(studentId);
  }

  return (
    <div className="grid grid-2">
      <div className="card stack">
        <h2>Conversa</h2>
        <select className="input" value={studentId} onChange={(e) => load(e.target.value)}>{students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select>
        <form className="row" onSubmit={send}>
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Digite um recado" />
          <button className="btn primary">Enviar</button>
        </form>
      </div>
      <div className="stack">{messages.map((message) => <div className="card" key={message.id}><span className="badge">{message.sender_role}</span><p>{message.text}</p></div>)}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="label">{label}<input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} required /></label>;
}
