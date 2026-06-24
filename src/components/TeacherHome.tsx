'use client';

import { useEffect, useMemo, useState } from 'react';
import { StatusMessage } from '@/components/PanelState';
import { apiFetch } from '@/lib/fetcher';
import type { Activity, ActivitySubmission, ClassSchedule, Student } from '@/types';

function usePanelLoad(load: () => Promise<void>, interval = 15000) {
  useEffect(() => {
    load();
    const timer = window.setInterval(load, interval);
    return () => window.clearInterval(timer);
  }, []);
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function initials(name?: string) {
  if (!name) return 'A';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function TeacherHome() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  async function load() {
    try {
      setError('');
      const [studentData, scheduleData, activityData, submissionData] = await Promise.all([
        apiFetch<{ students: Student[] }>('/api/teacher/students'),
        apiFetch<{ classes: ClassSchedule[] }>('/api/teacher/schedule'),
        apiFetch<{ activities: Activity[] }>('/api/teacher/activities'),
        apiFetch<{ submissions: ActivitySubmission[] }>('/api/teacher/submissions'),
      ]);
      setStudents(studentData.students);
      setClasses(scheduleData.classes);
      setActivities(activityData.activities);
      setSubmissions(submissionData.submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar painel.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  const today = new Date();
  const todayKey = dateKey(today);
  const sortedClasses = useMemo(
    () => [...classes].sort((a, b) => `${a.class_date} ${a.class_time}`.localeCompare(`${b.class_date} ${b.class_time}`)),
    [classes],
  );
  const selectedClass =
    sortedClasses.find((item) => item.id === selectedClassId) ||
    sortedClasses.find((item) => item.status === 'scheduled' && item.class_date >= todayKey) ||
    sortedClasses[0];
  const selectedStudent = students.find((student) => student.id === selectedClass?.student_id) || students[0];
  const activeStudents = students.filter((student) => student.status !== 'inactive');
  const pendingActivities = activities.filter((activity) => !submissions.some((submission) => submission.activity_id === activity.id)).length;
  const monthlyRevenue = activeStudents.reduce((total, student) => {
    const monthlyClasses = student.classes_per_month || (student.classes_per_week || 0) * 4;
    return total + monthlyClasses * Number(student.price_per_class || 0);
  }, 0);

  const monthDays = useMemo(() => {
    const year = cursorDate.getFullYear();
    const month = cursorDate.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = dateKey(date);
      return {
        key,
        day: date.getDate(),
        currentMonth: date.getMonth() === month,
        today: key === todayKey,
        events: sortedClasses.filter((item) => item.class_date === key),
      };
    });
  }, [cursorDate, sortedClasses, todayKey]);

  return (
    <div className="teacher-agenda-home">
      <StatusMessage error={error} loading={loading} />
      <aside className="teacher-student-rail">
        <div className="rail-head">
          <h2>Alunos</h2>
          <button type="button" aria-label="Recolher painel">«</button>
        </div>
        <label className="rail-search">
          <span>⌕</span>
          <input placeholder="Buscar aluno..." />
        </label>
        <div className="student-list-clean">
          {students.length === 0 && <p className="muted">Cadastre alunos para preencher sua agenda.</p>}
          {students.slice(0, 12).map((student, index) => (
            <button
              type="button"
              className={student.id === selectedStudent?.id ? 'active' : ''}
              key={student.id}
              onClick={() => {
                const classForStudent = sortedClasses.find((item) => item.student_id === student.id);
                if (classForStudent) setSelectedClassId(classForStudent.id);
              }}
            >
              <span className={`student-avatar-clean tone-${index % 5}`}>{initials(student.full_name)}</span>
              <span className="student-dot" />
              <strong>{student.full_name}</strong>
            </button>
          ))}
        </div>
        <a href="/teacher/students">Ver todos os alunos</a>
      </aside>

      <section className="teacher-calendar-board">
        <div className="calendar-toolbar">
          <div>
            <h1>{monthLabel(cursorDate)}</h1>
            <p>{activeStudents.length} alunos ativos · {pendingActivities} atividades pendentes · {money(monthlyRevenue)} previstos</p>
          </div>
          <div>
            <button type="button" onClick={() => setCursorDate(new Date(cursorDate.getFullYear(), cursorDate.getMonth() - 1, 1))}>‹</button>
            <button type="button" onClick={() => setCursorDate(new Date())}>Hoje</button>
            <button type="button" onClick={() => setCursorDate(new Date(cursorDate.getFullYear(), cursorDate.getMonth() + 1, 1))}>›</button>
            <span>Mês</span>
          </div>
        </div>
        <div className="month-grid-clean">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => <strong key={day}>{day}</strong>)}
          {monthDays.map((day) => (
            <div className={`month-cell-clean ${day.currentMonth ? '' : 'muted-month'} ${day.today ? 'today' : ''}`} key={day.key}>
              <span>{day.day}</span>
              {day.events.slice(0, 3).map((event, index) => (
                <button
                  type="button"
                  className={`calendar-event-clean tone-${index % 4} ${event.id === selectedClass?.id ? 'selected' : ''}`}
                  key={event.id}
                  onClick={() => setSelectedClassId(event.id)}
                >
                  <i /> {event.students?.full_name?.split(' ')[0] || students.find((student) => student.id === event.student_id)?.full_name?.split(' ')[0] || 'Aluno'} · {event.class_time.slice(0, 5)}
                </button>
              ))}
            </div>
          ))}
        </div>
      </section>

      <aside className="teacher-detail-panel">
        <button className="student-side-close" type="button" aria-label="Fechar">×</button>
        <div className="detail-profile">
          <span className="detail-photo">{initials(selectedStudent?.full_name)}</span>
          <div>
            <h2>{selectedStudent?.full_name || 'Nenhum aluno'}</h2>
            <em>{selectedClass?.student_confirmed ? 'Confirmada' : 'Aguardando confirmação'}</em>
          </div>
        </div>
        <div className="detail-lines">
          <p>📅 {selectedClass ? new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date(`${selectedClass.class_date}T00:00:00`)) : 'Nenhuma aula selecionada'}</p>
          <p>🕒 {selectedClass ? `${selectedClass.class_time.slice(0, 5)} · ${selectedClass.duration_minutes} min` : 'Horário não definido'}</p>
          <p>📘 {selectedClass?.subject || selectedStudent?.subject || 'Matéria não definida'}</p>
        </div>
        <a className="side-primary" href="/teacher/schedule">Abrir agenda</a>
        <a className="outline-action" href="/teacher/students">Administrar aluno</a>
        <div className="teacher-day-tasks">
          <h3>Para hoje</h3>
          <label><input type="checkbox" readOnly /> Corrigir {submissions.filter((item) => item.status === 'submitted').length} atividades</label>
          <label><input type="checkbox" readOnly /> Conferir presenças</label>
        </div>
      </aside>
    </div>
  );
}
