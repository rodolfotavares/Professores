'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/fetcher';
import { EmptyState, StatusMessage } from '@/components/PanelState';
import type { Activity, ActivitySubmission, ClassSchedule, Message, Student } from '@/types';

const weekDays = [
  { label: 'Dom', value: '0' },
  { label: 'Seg', value: '1' },
  { label: 'Ter', value: '2' },
  { label: 'Qua', value: '3' },
  { label: 'Qui', value: '4' },
  { label: 'Sex', value: '5' },
  { label: 'Sab', value: '6' },
];

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

export function TeacherDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const [s, c, a] = await Promise.all([
        apiFetch<{ students: Student[] }>('/api/teacher/students'),
        apiFetch<{ classes: ClassSchedule[] }>('/api/teacher/schedule'),
        apiFetch<{ activities: Activity[] }>('/api/teacher/activities'),
      ]);
      setStudents(s.students);
      setClasses(c.classes);
      setActivities(a.activities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar painel.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  const pendingClasses = classes.filter((item) => item.status === 'scheduled').length;

  return (
    <div className="stack">
      <StatusMessage error={error} loading={loading} />
      <div className="grid grid-3">
        <Stat title="Alunos ativos" value={students.length} />
        <Stat title="Aulas agendadas" value={pendingClasses} />
        <Stat title="Atividades" value={activities.length} />
      </div>
      <div className="panel-note">
        Os dados atualizam automaticamente a cada poucos segundos. Se voce cadastrar um aluno pelo mesmo navegador, continue usando este painel para manter a sessao do professor.
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="metric">
      <p className="muted">{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

export function StudentsPanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const emptyForm = { full_name: '', email: '', whatsapp: '', subject: '', days_of_week: '1,3', class_time: '14:00', classes_per_week: '2', price_per_class: '100' };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [regenerateSchedule, setRegenerateSchedule] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const data = await apiFetch<{ students: Student[] }>('/api/teacher/students');
      setStudents(data.students);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar alunos.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  function toggleDay(day: string) {
    const selected = form.days_of_week ? form.days_of_week.split(',').filter(Boolean) : [];
    const next = selected.includes(day) ? selected.filter((item) => item !== day) : [...selected, day];
    setForm({ ...form, days_of_week: next.sort().join(',') });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await apiFetch(`/api/teacher/students/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ ...form, classes_per_week: Number(form.classes_per_week || 0), price_per_class: Number(form.price_per_class || 0), duration_minutes: 60, regenerate_schedule: regenerateSchedule }),
        });
      } else {
        await apiFetch('/api/teacher/students', { method: 'POST', body: JSON.stringify({ ...form, classes_per_week: Number(form.classes_per_week || 0), price_per_class: Number(form.price_per_class || 0), duration_minutes: 60 }) });
      }
      setForm(emptyForm);
      setEditingId('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar aluno.');
    } finally {
      setSaving(false);
    }
  }

  function editStudent(student: Student) {
    setEditingId(student.id);
    setForm({
      full_name: student.full_name,
      email: student.email,
      whatsapp: student.whatsapp || '',
      subject: student.subject || '',
      days_of_week: student.days_of_week?.join(',') || '',
      class_time: student.class_time || '14:00',
      classes_per_week: String(student.classes_per_week || 2),
      price_per_class: String(student.price_per_class || 100),
    });
    setRegenerateSchedule(true);
  }

  async function deleteStudent(student: Student) {
    const ok = window.confirm(`Excluir ${student.full_name}? Isso remove agenda, atividades, entregas e recados vinculados.`);
    if (!ok) return;
    await apiFetch(`/api/teacher/students/${student.id}`, { method: 'DELETE' });
    await load();
  }

  function cancelEdit() {
    setEditingId('');
    setForm(emptyForm);
  }

  const selectedDays = useMemo(() => form.days_of_week.split(',').filter(Boolean), [form.days_of_week]);
  const monthlyValue = (Number(form.classes_per_week || 0) * Number(form.price_per_class || 0) * 4).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="grid grid-2">
      <form className="card stack" onSubmit={submit}>
        <div>
          <span className="eyebrow">Cadastro vinculado</span>
          <h2>{editingId ? 'Editar aluno' : 'Novo aluno'}</h2>
        </div>
        <StatusMessage error={error} loading={false} />
        <Input label="Nome" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
        <Input label="E-mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Input label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
        <Input label="Materia" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} />
        <label className="label">Dias das aulas</label>
        <div className="segmented">
          {weekDays.map((day) => (
            <button type="button" className={selectedDays.includes(day.value) ? 'selected' : ''} onClick={() => toggleDay(day.value)} key={day.value}>
              {day.label}
            </button>
          ))}
        </div>
        <Input label="Horario" type="time" value={form.class_time} onChange={(v) => setForm({ ...form, class_time: v })} />
        <div className="grid grid-2 compact-grid">
          <Input label="Aulas por semana" type="number" value={form.classes_per_week} onChange={(v) => setForm({ ...form, classes_per_week: v })} />
          <Input label="Valor por aula" type="number" value={form.price_per_class} onChange={(v) => setForm({ ...form, price_per_class: v })} />
        </div>
        <div className="panel-note">Previsao mensal: <strong>{monthlyValue}</strong></div>
        {editingId && (
          <label className="check-row">
            <input type="checkbox" checked={regenerateSchedule} onChange={(event) => setRegenerateSchedule(event.target.checked)} />
            Recriar aulas futuras com estes dias e horario
          </label>
        )}
        <div className="row">
          <button className="btn primary" disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Salvar alteracoes' : 'Salvar e gerar agenda'}</button>
          {editingId && <button type="button" className="btn" onClick={cancelEdit}>Cancelar edicao</button>}
        </div>
      </form>
      <div className="stack">
        <StatusMessage error="" loading={loading} />
        {!loading && students.length === 0 && <EmptyState title="Nenhum aluno ainda" text="Cadastre ou peça para o aluno usar o codigo do professor." />}
        {students.map((student) => (
          <div className="card list-item" key={student.id}>
            <div>
              <strong>{student.full_name}</strong>
              <p className="muted">{student.email} - {student.subject || 'Sem materia'}</p>
              <small>{student.class_time ? `Aulas as ${student.class_time}` : 'Horario nao definido'}</small>
              <p className="muted">{student.classes_per_week || 0} aulas/semana - {Number(student.price_per_class || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por aula - mensal: {Number((student.classes_per_week || 0) * (student.price_per_class || 0) * 4).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>
            <div className="row">
              <span className="badge">{student.status}</span>
              <button className="btn small" onClick={() => editStudent(student)}>Editar</button>
              <button className="btn small danger" onClick={() => deleteStudent(student)}>Excluir</button>
            </div>
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
  const [editingClassId, setEditingClassId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const [s, c] = await Promise.all([
        apiFetch<{ students: Student[] }>('/api/teacher/students'),
        apiFetch<{ classes: ClassSchedule[] }>('/api/teacher/schedule'),
      ]);
      setStudents(s.students);
      setClasses(c.classes);
      if (!form.student_id && s.students[0]) setForm((current) => ({ ...current, student_id: s.students[0].id }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar agenda.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.student_id) return;
    if (editingClassId) {
      await apiFetch(`/api/teacher/schedule/${editingClassId}`, { method: 'PATCH', body: JSON.stringify({ class_date: form.class_date, class_time: form.class_time, duration_minutes: 60 }) });
      setEditingClassId('');
    } else {
      await apiFetch('/api/teacher/schedule', { method: 'POST', body: JSON.stringify({ ...form, duration_minutes: 60 }) });
    }
    await load();
  }

  async function updateStatus(id: string, status: string) {
    await apiFetch(`/api/teacher/schedule/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await load();
  }

  function editClass(item: ClassSchedule) {
    setEditingClassId(item.id);
    setForm({ student_id: item.student_id, class_date: item.class_date, class_time: item.class_time.slice(0, 5) });
  }

  async function deleteClass(id: string) {
    const ok = window.confirm('Excluir esta aula da agenda?');
    if (!ok) return;
    await apiFetch(`/api/teacher/schedule/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className="grid grid-2">
      <form className="card stack" onSubmit={submit}>
        <h2>{editingClassId ? 'Editar aula' : 'Agendar aula'}</h2>
        <StatusMessage error={error} loading={false} />
        <label className="label">Aluno<select className="input" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}>{students.map((s) => <option value={s.id} key={s.id}>{s.full_name}</option>)}</select></label>
        <Input label="Data" type="date" value={form.class_date} onChange={(v) => setForm({ ...form, class_date: v })} />
        <Input label="Horario" type="time" value={form.class_time} onChange={(v) => setForm({ ...form, class_time: v })} />
        <div className="row">
          <button className="btn primary" disabled={!students.length}>{editingClassId ? 'Salvar aula' : 'Agendar'}</button>
          {editingClassId && <button type="button" className="btn" onClick={() => setEditingClassId('')}>Cancelar</button>}
        </div>
      </form>
      <div className="stack">
        <StatusMessage error="" loading={loading} />
        {!loading && classes.length === 0 && <EmptyState title="Agenda vazia" text="Crie um aluno com dias e horario ou agende uma aula manualmente." />}
        {classes.map((item) => (
          <div className="card" key={item.id}>
            <div className="list-item">
              <div>
                <strong>{item.students?.full_name || item.student_id}</strong>
                <p className="muted">{item.class_date} as {item.class_time} - {item.status}</p>
              </div>
              {item.student_confirmed && <span className="badge">Confirmada</span>}
            </div>
            <div className="row">
              <button className="btn" onClick={() => updateStatus(item.id, 'completed')}>Realizada</button>
              <button className="btn" onClick={() => updateStatus(item.id, 'cancelled')}>Cancelar</button>
              <button className="btn" onClick={() => updateStatus(item.id, 'absence')}>Falta</button>
              <button className="btn" onClick={() => editClass(item)}>Editar</button>
              <button className="btn danger" onClick={() => deleteClass(item.id)}>Excluir</button>
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
  const [file, setFile] = useState<File | null>(null);
  const [grade, setGrade] = useState('10');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const [s, a, delivered] = await Promise.all([
        apiFetch<{ students: Student[] }>('/api/teacher/students'),
        apiFetch<{ activities: Activity[] }>('/api/teacher/activities'),
        apiFetch<{ submissions: ActivitySubmission[] }>('/api/teacher/submissions'),
      ]);
      setStudents(s.students);
      setActivities(a.activities);
      setSubmissions(delivered.submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar atividades.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const uploaded = file ? await uploadFile(file) : null;
      await apiFetch('/api/teacher/activities', { method: 'POST', body: JSON.stringify({ ...form, points: 10, student_id: form.student_id || undefined, file_url: uploaded?.url }) });
      setForm({ title: '', description: '', subject: '', student_id: '', due_date: '' });
      setFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar atividade.');
    } finally {
      setSaving(false);
    }
  }

  async function correct(id: string) {
    await apiFetch(`/api/teacher/submissions/${id}/correct`, { method: 'PATCH', body: JSON.stringify({ grade: Number(grade), feedback: 'Corrigida pelo professor' }) });
    await load();
  }

  return (
    <div className="grid grid-2">
      <form className="card stack" onSubmit={submit}>
        <h2>Nova atividade</h2>
        <StatusMessage error={error} loading={false} />
        <Input label="Titulo" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <label className="label">Descricao<textarea className="input textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <Input label="Materia" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} />
        <label className="label">Aluno<select className="input" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}><option value="">Todos</option>{students.map((s) => <option value={s.id} key={s.id}>{s.full_name}</option>)}</select></label>
        <Input label="Prazo" type="date" value={form.due_date} onChange={(v) => setForm({ ...form, due_date: v })} />
        <label className="label">Arquivo da atividade<input className="input" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
        <button className="btn primary" disabled={saving}>{saving ? 'Enviando...' : 'Criar'}</button>
      </form>
      <div className="stack">
        <StatusMessage error="" loading={loading} />
        {!loading && activities.length === 0 && <EmptyState title="Nenhuma atividade" text="Crie uma atividade para todos os alunos ou para um aluno especifico." />}
        {submissions.map((submission) => (
          <div className="card" key={submission.id}>
            <strong>{submission.activities?.title}</strong>
            <p className="muted">{submission.students?.full_name || 'Aluno'} - {submission.status}</p>
            <p>{submission.answer_text}</p>
            {submission.answer_file_url && <a className="file-link" href={submission.answer_file_url} target="_blank">Arquivo entregue pelo aluno</a>}
            <Input label="Nota" value={grade} onChange={setGrade} />
            <button className="btn primary" onClick={() => correct(submission.id)}>Corrigir</button>
          </div>
        ))}
        {activities.map((activity) => (
          <div className="card list-item" key={activity.id}>
            <div>
              <strong>{activity.title}</strong>
              <p className="muted">{activity.students?.full_name || 'Todos'} - {activity.status}</p>
              {activity.file_url && <a className="file-link" href={activity.file_url} target="_blank">Arquivo da atividade</a>}
            </div>
            <span className="badge">{activity.due_date || 'Sem prazo'}</span>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(nextStudentId = studentId) {
    try {
      setError('');
      const studentsData = await apiFetch<{ students: Student[] }>('/api/teacher/students');
      setStudents(studentsData.students);
      const selected = nextStudentId || studentsData.students[0]?.id || '';
      setStudentId(selected);
      if (selected) {
        const data = await apiFetch<{ messages: Message[] }>(`/api/messages?student_id=${selected}`);
        setMessages(data.messages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar recados.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(() => load());

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!studentId || !text.trim()) return;
    await apiFetch('/api/messages', { method: 'POST', body: JSON.stringify({ student_id: studentId, text }) });
    setText('');
    await load(studentId);
  }

  return (
    <div className="grid grid-2">
      <div className="card stack">
        <h2>Conversa</h2>
        <StatusMessage error={error} loading={loading} />
        <select className="input" value={studentId} onChange={(e) => load(e.target.value)}>{students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select>
        <form className="row" onSubmit={send}>
          <input className="input grow" value={text} onChange={(e) => setText(e.target.value)} placeholder="Digite um recado" />
          <button className="btn primary" disabled={!studentId}>Enviar</button>
        </form>
      </div>
      <div className="stack">
        {!loading && messages.length === 0 && <EmptyState title="Sem recados" text="As mensagens trocadas com o aluno aparecem aqui." />}
        {messages.map((message) => <div className="card" key={message.id}><span className="badge">{message.sender_role}</span><p>{message.text}</p></div>)}
      </div>
    </div>
  );
}

type LessonPlan = {
  title: string;
  summary: string;
  steps: string[];
  materials: string[];
  homework: string;
};

export function LessonPlannerPanel() {
  const [form, setForm] = useState({ subject: '', topic: '', level: '', duration: '60 minutos', objective: '' });
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<{ plan: LessonPlan }>('/api/teacher/lesson-plan', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setPlan(data.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar plano.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-2">
      <form className="card stack" onSubmit={submit}>
        <div>
          <span className="eyebrow">Assistente do professor</span>
          <h2>Planejar aula</h2>
        </div>
        <StatusMessage error={error} loading={false} />
        <Input label="Materia" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} />
        <Input label="Tema da aula" value={form.topic} onChange={(v) => setForm({ ...form, topic: v })} />
        <Input label="Nivel do aluno" value={form.level} onChange={(v) => setForm({ ...form, level: v })} />
        <Input label="Duracao" value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} />
        <label className="label">Objetivo<textarea className="input textarea" value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} /></label>
        <button className="btn primary" disabled={loading}>{loading ? 'Gerando...' : 'Gerar plano'}</button>
      </form>
      <div className="stack">
        {!plan && <EmptyState title="Plano pronto para montar" text="Informe materia, tema e objetivo para receber uma estrutura de aula." />}
        {plan && (
          <div className="card stack">
            <div>
              <span className="eyebrow">Plano sugerido</span>
              <h2>{plan.title}</h2>
              <p className="muted">{plan.summary}</p>
            </div>
            <div>
              <strong>Roteiro</strong>
              <ol className="clean-list">{plan.steps.map((step) => <li key={step}>{step}</li>)}</ol>
            </div>
            <div>
              <strong>Materiais</strong>
              <ul className="clean-list">{plan.materials.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <div className="panel-note"><strong>Tarefa sugerida:</strong> {plan.homework}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="label">{label}<input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} required /></label>;
}
