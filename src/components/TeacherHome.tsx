'use client';

import type { DragEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusMessage } from '@/components/PanelState';
import { apiFetch } from '@/lib/fetcher';
import type { ClassSchedule, Student } from '@/types';

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

function googleCalendarTemplateUrl(item: ClassSchedule, studentName: string) {
  const [hours, minutes] = item.class_time.slice(0, 5).split(':').map(Number);
  const start = new Date(`${item.class_date}T00:00:00`);
  start.setHours(hours || 0, minutes || 0, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + (item.duration_minutes || 60));
  const format = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}${mm}${dd}T${hh}${min}00`;
  };
  const meetingLink = item.meeting_url || item.meeting_start_url || '';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Aula - ${studentName}`,
    dates: `${format(start)}/${format(end)}`,
    details: ['Aula cadastrada no LuminaAI.', item.subject ? `Materia: ${item.subject}` : null, meetingLink ? `Link da aula: ${meetingLink}` : null].filter(Boolean).join('\n'),
    location: meetingLink,
    ctz: 'America/Sao_Paulo',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function SearchGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function TeacherHome() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [dragOverDate, setDragOverDate] = useState('');

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
  const scheduledClasses = classes.filter((item) => item.status === 'scheduled').length;
  const monthlyRevenue = activeStudents.reduce((total, student) => {
    const monthlyClasses = student.classes_per_month || (student.classes_per_week || 0) * 4;
    return total + monthlyClasses * Number(student.price_per_class || 0);
  }, 0);
  const mobileUpcomingClasses = useMemo(
    () => sortedClasses.filter((item) => item.status === 'scheduled' && item.class_date >= todayKey).slice(0, 8),
    [sortedClasses, todayKey],
  );

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

  useEffect(() => {
    setRescheduleDate(selectedClass?.class_date || todayKey);
    setRescheduleTime(selectedClass?.class_time?.slice(0, 5) || selectedStudent?.class_time?.slice(0, 5) || '14:00');
  }, [selectedClass?.id, selectedClass?.class_date, selectedClass?.class_time, selectedStudent?.class_time, todayKey]);

  async function updateClassStatus(status: 'completed' | 'cancelled' | 'scheduled') {
    if (!selectedClass) return;
    setActionLoading(status);
    setError('');
    try {
      await apiFetch(`/api/teacher/schedule/${selectedClass.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar aula.');
    } finally {
      setActionLoading('');
    }
  }

  async function smartLessonAction(action: 'start' | 'finish') {
    if (!selectedClass) return;
    setActionLoading(action);
    setError('');
    try {
      await apiFetch<{ class: ClassSchedule }>(`/api/teacher/schedule/${selectedClass.id}/smart`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      await load();
      if (action === 'finish') router.push(`/teacher/smart-lesson?lesson_id=${selectedClass.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar Aula Inteligente.');
    } finally {
      setActionLoading('');
    }
  }

  async function startSelectedClass() {
    if (!selectedClass) return;
    const meetingLink = selectedClass.meeting_start_url || selectedClass.meeting_url;
    if (meetingLink) {
      window.open(meetingLink, '_blank', 'noopener,noreferrer');
    }
    await smartLessonAction('start');
    if (!meetingLink) {
      setError('Esta aula ainda nao tem link online. Abra Lumi Assistente e clique em gerar links das aulas existentes.');
    }
  }

  async function rescheduleClass() {
    if (!selectedStudent || !rescheduleDate || !rescheduleTime) return;
    setActionLoading('reschedule');
    setError('');
    try {
      if (selectedClass) {
        await apiFetch(`/api/teacher/schedule/${selectedClass.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ class_date: rescheduleDate, class_time: rescheduleTime, status: 'scheduled' }),
        });
      } else {
        await apiFetch('/api/teacher/schedule', {
          method: 'POST',
          body: JSON.stringify({ student_id: selectedStudent.id, class_date: rescheduleDate, class_time: rescheduleTime, duration_minutes: selectedStudent.duration_minutes || 60 }),
        });
      }
      setCursorDate(new Date(`${rescheduleDate}T00:00:00`));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao reagendar aula.');
    } finally {
      setActionLoading('');
    }
  }

  function startClassDrag(event: DragEvent<HTMLButtonElement>, item: ClassSchedule) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/lumina-class-id', item.id);
    event.dataTransfer.setData('text/plain', item.id);
    setSelectedClassId(item.id);
  }

  function startStudentDrag(event: DragEvent<HTMLButtonElement>, student: Student) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/lumina-student-id', student.id);
    event.dataTransfer.setData('text/plain', student.id);
  }

  async function moveClassToDate(classId: string, targetDate: string) {
    const item = classes.find((classItem) => classItem.id === classId);
    if (!item || item.class_date === targetDate) return;
    const previousClasses = classes;

    setSelectedClassId(classId);
    setClasses((current) => current.map((classItem) => (
      classItem.id === classId ? { ...classItem, class_date: targetDate, status: 'scheduled' } : classItem
    )));
    setRescheduleDate(targetDate);
    setCursorDate(new Date(`${targetDate}T00:00:00`));
    setError('');

    try {
      await apiFetch(`/api/teacher/schedule/${classId}`, {
        method: 'PATCH',
        body: JSON.stringify({ class_date: targetDate, class_time: item.class_time?.slice(0, 5), status: 'scheduled' }),
      });
      await load();
    } catch (err) {
      setClasses(previousClasses);
      setError(err instanceof Error ? err.message : 'Falha ao mover aula na agenda.');
    }
  }

  async function moveStudentToDate(studentId: string, targetDate: string) {
    const student = students.find((item) => item.id === studentId);
    if (!student) return;
    const classForStudent =
      sortedClasses.find((item) => item.student_id === studentId && item.status === 'scheduled' && item.class_date >= todayKey) ||
      sortedClasses.find((item) => item.student_id === studentId && item.status === 'scheduled') ||
      sortedClasses.find((item) => item.student_id === studentId);

    if (classForStudent) {
      await moveClassToDate(classForStudent.id, targetDate);
      return;
    }

    const classTime = student.class_time?.slice(0, 5) || '14:00';
    setError('');
    try {
      const data = await apiFetch<{ class: ClassSchedule }>('/api/teacher/schedule', {
        method: 'POST',
        body: JSON.stringify({
          student_id: student.id,
          class_date: targetDate,
          class_time: classTime,
          duration_minutes: student.duration_minutes || 60,
        }),
      });
      setClasses((current) => [...current, data.class]);
      setSelectedClassId(data.class.id);
      setRescheduleDate(targetDate);
      setRescheduleTime(classTime);
      setCursorDate(new Date(`${targetDate}T00:00:00`));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar aula na agenda.');
    }
  }

  async function dropOnDay(event: DragEvent<HTMLDivElement>, targetDate: string) {
    event.preventDefault();
    setDragOverDate('');
    const classId = event.dataTransfer.getData('application/lumina-class-id');
    const studentId = event.dataTransfer.getData('application/lumina-student-id');
    if (classId) {
      await moveClassToDate(classId, targetDate);
      return;
    }
    if (studentId) await moveStudentToDate(studentId, targetDate);
  }

  return (
    <div className="teacher-agenda-home">
      <StatusMessage error={error} loading={loading} />
      <section className="teacher-mobile-quick-panel" aria-label="Agenda simplificada">
        <div className="mobile-section-head">
          <div>
            <span>Hoje</span>
            <h2>Agenda rápida</h2>
          </div>
          <a href="/teacher/students">Novo aluno</a>
        </div>
        <div className="teacher-mobile-stats">
          <article>
            <span>Alunos</span>
            <strong>{activeStudents.length}</strong>
          </article>
          <article>
            <span>Aulas</span>
            <strong>{scheduledClasses}</strong>
          </article>
          <article>
            <span>Previsão</span>
            <strong>{money(monthlyRevenue)}</strong>
          </article>
        </div>
        <div className="mobile-agenda-list">
          {mobileUpcomingClasses.length === 0 && (
            <div className="mobile-empty-state">
              <strong>Nenhuma aula futura</strong>
              <span>Arraste alunos no calendário pelo computador ou crie uma aula pelo cadastro do aluno.</span>
            </div>
          )}
          {mobileUpcomingClasses.map((item) => {
            const student = students.find((studentItem) => studentItem.id === item.student_id);
            const isSelected = item.id === selectedClass?.id;
            return (
              <button
                type="button"
                className={`mobile-agenda-item ${isSelected ? 'active' : ''}`}
                key={item.id}
                onClick={() => {
                  setSelectedClassId(item.id);
                  setRescheduleDate(item.class_date);
                  setRescheduleTime(item.class_time.slice(0, 5));
                }}
              >
                <span className="mobile-date-pill">
                  <strong>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit' }).format(new Date(`${item.class_date}T00:00:00`))}</strong>
                  <small>{new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(new Date(`${item.class_date}T00:00:00`)).replace('.', '')}</small>
                </span>
                <span>
                  <strong>{student?.full_name || item.students?.full_name || 'Aluno'}</strong>
                  <small>{item.subject || student?.subject || 'Aula particular'} • {item.class_time.slice(0, 5)}</small>
                </span>
                <em>{isSelected ? 'Selecionada' : 'Abrir'}</em>
              </button>
            );
          })}
        </div>
      </section>
      <aside className="teacher-student-rail">
        <div className="rail-head">
          <h2>Alunos</h2>
          <button type="button" aria-label="Recolher painel">‹</button>
        </div>
        <label className="rail-search">
          <SearchGlyph />
          <input placeholder="Buscar aluno..." />
        </label>
        <div className="student-list-clean">
          {students.length === 0 && <p className="muted">Cadastre alunos para preencher sua agenda.</p>}
          {students.slice(0, 12).map((student, index) => (
            <button
              type="button"
              className={student.id === selectedStudent?.id ? 'active' : ''}
              key={student.id}
              draggable
              onDragStart={(event) => startStudentDrag(event, student)}
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
            <p>{activeStudents.length} alunos ativos · {scheduledClasses} aulas agendadas · {money(monthlyRevenue)} previstos</p>
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
            <div
              className={`month-cell-clean ${day.currentMonth ? '' : 'muted-month'} ${day.today ? 'today' : ''} ${dragOverDate === day.key ? 'drop-target' : ''}`}
              key={day.key}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                setDragOverDate(day.key);
              }}
              onDragLeave={() => setDragOverDate((current) => (current === day.key ? '' : current))}
              onDrop={(event) => dropOnDay(event, day.key)}
            >
              <span>{day.day}</span>
              {day.events.slice(0, 3).map((event, index) => (
                <button
                  type="button"
                  className={`calendar-event-clean tone-${index % 4} ${event.id === selectedClass?.id ? 'selected' : ''}`}
                  key={event.id}
                  draggable
                  onDragStart={(dragEvent) => startClassDrag(dragEvent, event)}
                  onDragEnd={() => setDragOverDate('')}
                  onClick={() => setSelectedClassId(event.id)}
                  title="Arraste para outro dia para reagendar"
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
          <p><span>Data</span>{selectedClass ? new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date(`${selectedClass.class_date}T00:00:00`)) : 'Nenhuma aula selecionada'}</p>
          <p><span>Horário</span>{selectedClass ? `${selectedClass.class_time.slice(0, 5)} · ${selectedClass.duration_minutes} min` : 'Horário não definido'}</p>
          <p><span>Matéria</span>{selectedClass?.subject || selectedStudent?.subject || 'Matéria não definida'}</p>
          <p><span>Link da aula</span>{selectedClass?.meeting_url ? <a href={selectedClass.meeting_url} target="_blank" rel="noreferrer">Abrir aula online</a> : 'Gere os links em Lumi Assistente'}</p>
        </div>
        <div className="lesson-action-box">
          <h3>Ações da aula</h3>
          <div className="smart-lesson-actions-inline">
            <button type="button" className="outline-action" onClick={startSelectedClass} disabled={!selectedClass || actionLoading === 'start'}>
              {actionLoading === 'start' ? 'Iniciando...' : 'Iniciar aula'}
            </button>
            <button type="button" className="side-primary" onClick={() => smartLessonAction('finish')} disabled={!selectedClass || actionLoading === 'finish'}>
              {actionLoading === 'finish' ? 'Finalizando...' : 'Finalizar aula'}
            </button>
            <button type="button" className="outline-action" onClick={() => selectedClass && router.push(`/teacher/smart-lesson?lesson_id=${selectedClass.id}`)} disabled={!selectedClass}>
              Aula Inteligente
            </button>
            <button type="button" className="outline-action" onClick={() => selectedClass && window.open(googleCalendarTemplateUrl(selectedClass, selectedStudent?.full_name || 'Aluno'), '_blank', 'noopener,noreferrer')} disabled={!selectedClass}>
              Adicionar ao Google Agenda
            </button>
          </div>
          <label>
            <span>Nova data</span>
            <input type="date" value={rescheduleDate} onChange={(event) => setRescheduleDate(event.target.value)} />
          </label>
          <label>
            <span>Novo horário</span>
            <input type="time" value={rescheduleTime} onChange={(event) => setRescheduleTime(event.target.value)} />
          </label>
          <button type="button" className="outline-action" onClick={rescheduleClass} disabled={!selectedStudent || actionLoading === 'reschedule'}>
            {actionLoading === 'reschedule' ? 'Reagendando...' : 'Reagendar aula'}
          </button>
          <button type="button" className="side-primary" onClick={() => updateClassStatus('completed')} disabled={!selectedClass || actionLoading === 'completed'}>
            {actionLoading === 'completed' ? 'Confirmando...' : 'Confirmar aula'}
          </button>
          <button type="button" className="outline-action danger-outline" onClick={() => updateClassStatus('cancelled')} disabled={!selectedClass || actionLoading === 'cancelled'}>
            {actionLoading === 'cancelled' ? 'Desmarcando...' : 'Desmarcar aula'}
          </button>
        </div>
        <a className="outline-action" href="/teacher/students">Administrar aluno</a>
        <div className="teacher-day-tasks">
          <h3>Para hoje</h3>
          <label><input type="checkbox" readOnly /> Revisar agenda do dia</label>
          <label><input type="checkbox" readOnly /> Conferir presenças</label>
        </div>
      </aside>
    </div>
  );
}
