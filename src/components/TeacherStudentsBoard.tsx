'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { StatusMessage } from '@/components/PanelState';
import { apiFetch } from '@/lib/fetcher';
import { formatBrazilWhatsapp, isValidBrazilPhone, normalizeBrazilPhone } from '@/lib/validation';
import type { ClassSchedule, Student } from '@/types';

const emptyForm = {
  full_name: '',
  email: '',
  whatsapp: '',
  subject: '',
  class_time: '14:00',
  classes_per_week: '2',
  price_per_class: '120',
  status: 'active',
};

function usePanelLoad(load: () => Promise<void>, interval = 15000) {
  useEffect(() => {
    load();
    const timer = window.setInterval(load, interval);
    return () => window.clearInterval(timer);
  }, []);
}

function initials(name?: string) {
  return (name || 'Aluno')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function currency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function nextClassFor(student: Student, classes: ClassSchedule[]) {
  const today = new Date().toISOString().slice(0, 10);
  return [...classes]
    .filter((item) => item.student_id === student.id && item.status === 'scheduled' && item.class_date >= today)
    .sort((a, b) => `${a.class_date} ${a.class_time}`.localeCompare(`${b.class_date} ${b.class_time}`))[0];
}

export function TeacherStudentsBoard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'ok' | 'attention'>('all');
  const [form, setForm] = useState(emptyForm);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      if (!selectedId && studentData.students[0]) setSelectedId(studentData.students[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar alunos.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  const selectedStudent = students.find((student) => student.id === selectedId) || null;

  useEffect(() => {
    if (isNew) {
      setForm(emptyForm);
      return;
    }
    if (!selectedStudent) return;
    setForm({
      full_name: selectedStudent.full_name,
      email: selectedStudent.email,
      whatsapp: formatBrazilWhatsapp(selectedStudent.whatsapp || ''),
      subject: selectedStudent.subject || '',
      class_time: selectedStudent.class_time?.slice(0, 5) || '14:00',
      classes_per_week: String(selectedStudent.classes_per_week || 2),
      price_per_class: String(selectedStudent.price_per_class || 120),
      status: selectedStudent.status || 'active',
    });
  }, [selectedStudent?.id, isNew]);

  const rows = useMemo(() => {
    return students.map((student) => {
      const nextClass = nextClassFor(student, classes);
      const classesPerWeek = student.classes_per_week || 0;
      const progress = Math.min(95, Math.max(20, classesPerWeek * 15));
      const attention = student.status !== 'active' || classesPerWeek <= 1;
      return { student, nextClass, progress, attention };
    });
  }, [students, classes]);

  const filteredRows = rows.filter(({ student, attention }) => {
    const matchesQuery = student.full_name.toLowerCase().includes(query.toLowerCase()) || (student.subject || '').toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'attention' ? attention : !attention);
    return matchesQuery && matchesFilter;
  });

  function startNew() {
    setIsNew(true);
    setSelectedId('');
    setForm(emptyForm);
  }

  function selectStudent(student: Student) {
    setIsNew(false);
    setSelectedId(student.id);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (form.whatsapp && !isValidBrazilPhone(form.whatsapp)) throw new Error('Informe um WhatsApp brasileiro válido com DDD.');
      const payload = {
        full_name: form.full_name,
        email: form.email,
        whatsapp: form.whatsapp ? normalizeBrazilPhone(form.whatsapp) : undefined,
        subject: form.subject,
        days_of_week: '1,3',
        class_time: form.class_time,
        duration_minutes: 60,
        classes_per_week: Number(form.classes_per_week || 0),
        price_per_class: Number(form.price_per_class || 0),
        status: form.status,
        regenerate_schedule: true,
      };
      if (isNew || !selectedStudent) {
        await apiFetch('/api/teacher/students', { method: 'POST', body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/api/teacher/students/${selectedStudent.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      }
      setIsNew(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar aluno.');
    } finally {
      setSaving(false);
    }
  }

  const monthlyValue = Number(form.classes_per_week || 0) * Number(form.price_per_class || 0) * 4;

  return (
    <div className="students-reference-page">
      <section className="students-reference-main">
        <div className="students-reference-header">
          <div>
            <h1>Alunos</h1>
            <p>Gerencie sua turma e acompanhe cada evolução.</p>
          </div>
          <button className="new-student-button" type="button" onClick={startNew}>
            <span>+</span> Novo aluno
          </button>
        </div>
        <StatusMessage error={error} loading={loading} />
        <div className="students-reference-tools">
          <label className="students-search">
            <span>⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar aluno por nome..." />
          </label>
          <div className="students-filter-tabs">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')} type="button">Todos</button>
            <button className={filter === 'ok' ? 'active ok' : 'ok'} onClick={() => setFilter('ok')} type="button">Em dia</button>
            <button className={filter === 'attention' ? 'active attention' : 'attention'} onClick={() => setFilter('attention')} type="button">Atenção</button>
          </div>
        </div>
        <div className="student-card-grid">
          {filteredRows.map(({ student, nextClass, progress, attention }, index) => (
            <button className={`student-profile-card-ref ${student.id === selectedId ? 'selected' : ''}`} key={student.id} type="button" onClick={() => selectStudent(student)}>
              <div className="student-card-top">
                <span className={`student-photo-ref tone-${index % 6}`}>{initials(student.full_name)}</span>
                <div>
                  <h2>{student.full_name}</h2>
                  <p>{student.subject || 'Matéria não definida'}</p>
                </div>
                <em>•••</em>
              </div>
              <span className={`student-status-pill ${attention ? 'attention' : 'ok'}`}>{attention ? 'Atenção' : 'Em dia'}</span>
              <p className="next-class-line">Próxima aula: {nextClass ? `${nextClass.class_date.slice(5).replace('-', '/')} · ${nextClass.class_time.slice(0, 5)}` : 'sem aula marcada'}</p>
              <div className="student-progress-line">
                <span>{student.classes_per_week || 0} aulas por semana</span>
                <strong>{progress}%</strong>
              </div>
              <div className="student-progress-track"><span style={{ width: `${progress}%` }} className={attention ? 'attention' : ''} /></div>
            </button>
          ))}
        </div>
        <p className="students-reference-count">Mostrando {filteredRows.length} de {students.length} alunos</p>
      </section>

      <aside className="student-edit-panel-ref">
        <button className="student-side-close" type="button" aria-label="Fechar">×</button>
        <h2>{isNew ? 'Novo aluno' : 'Editar aluno'}</h2>
        <div className="student-edit-avatar-wrap">
          <span className="student-edit-avatar">{initials(form.full_name)}</span>
          <button type="button" aria-label="Alterar foto">□</button>
        </div>
        <form className="student-edit-form-ref" onSubmit={submit}>
          <label>Nome completo<input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} required /></label>
          <label>E-mail<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
          <label>Telefone<input value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: formatBrazilWhatsapp(event.target.value) })} placeholder="(11) 98765-4321" /></label>
          <label>Matéria<input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></label>
          <label>Horário padrão<input type="time" value={form.class_time} onChange={(event) => setForm({ ...form, class_time: event.target.value })} /></label>
          <label>Valor da aula (R$)<input type="number" value={form.price_per_class} onChange={(event) => setForm({ ...form, price_per_class: event.target.value })} /></label>
          <label>Pacote de aulas<select value={form.classes_per_week} onChange={(event) => setForm({ ...form, classes_per_week: event.target.value })}>
            <option value="1">Pacote 4 aulas</option>
            <option value="2">Pacote 8 aulas</option>
            <option value="3">Pacote 12 aulas</option>
            <option value="4">Pacote 16 aulas</option>
          </select></label>
          <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="active">Em dia</option>
            <option value="paused">Atenção</option>
            <option value="inactive">Inativo</option>
          </select></label>
          <div className="student-edit-total">Previsão mensal <strong>{currency(monthlyValue)}</strong></div>
          <div className="student-edit-actions">
            <button className="outline-action" type="button" onClick={() => { setIsNew(false); if (students[0]) setSelectedId(students[0].id); }}>Cancelar</button>
            <button className="side-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</button>
          </div>
        </form>
      </aside>
    </div>
  );
}
