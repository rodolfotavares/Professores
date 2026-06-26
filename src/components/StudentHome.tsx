'use client';

import { useEffect, useState } from 'react';
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

function formatDate(date?: string) {
  if (!date) return 'Data não definida';
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date(`${date}T00:00:00`));
}

export function StudentHome() {
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

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const sortedClasses = [...classes].sort((a, b) => `${a.class_date} ${a.class_time}`.localeCompare(`${b.class_date} ${b.class_time}`));
  const nextClass = sortedClasses.find((item) => item.status === 'scheduled' && item.class_date >= todayKey) || sortedClasses.find((item) => item.status === 'scheduled') || sortedClasses[0];
  const pending = activities.filter((activity) => !submissions.some((submission) => submission.activity_id === activity.id));
  const completed = submissions.length;
  const progress = activities.length ? Math.round((completed / activities.length) * 100) : 0;
  const firstName = student?.full_name?.split(' ')[0] || 'aluno';
  const weekStart = new Date(today);
  const day = weekStart.getDay();
  weekStart.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date),
      day: new Intl.DateTimeFormat('pt-BR', { day: '2-digit' }).format(date),
      month: new Intl.DateTimeFormat('pt-BR', { month: '2-digit' }).format(date),
      active: key === todayKey,
      items: sortedClasses.filter((item) => item.class_date === key),
    };
  });
  const timeRows = ['08:00', '10:00', '14:00', '16:00', '18:00'];
  const continueItems = [
    { title: student?.subject || 'Matemática', note: 'Conteúdo da próxima aula', progress: progress || 65, tone: 'blue' },
    { title: pending[0]?.subject || 'Atividades', note: pending[0]?.title || 'Tarefas pendentes', progress: pending.length ? Math.max(40, 100 - pending.length * 20) : 100, tone: 'green' },
  ];

  async function confirmNextClass() {
    if (!nextClass || nextClass.student_confirmed) return;
    await apiFetch(`/api/student/schedule/${nextClass.id}/confirm`, { method: 'PATCH' });
    await load();
  }

  return (
    <div className="student-home">
      <StatusMessage error={error} loading={loading} />
      <section className="student-main-area">
        <div className="student-greeting">
          <h1>Olá, {firstName}</h1>
          <p>Sua semana de estudos</p>
        </div>

        <div className="student-summary-grid">
          <article className="student-summary-card">
            <div className="student-summary-icon">▣</div>
            <div>
              <span>Próxima aula</span>
              <strong>{nextClass?.subject || student?.subject || 'Aula'}</strong>
              <p>{nextClass ? `${nextClass.class_date === todayKey ? 'Hoje' : formatDate(nextClass.class_date)}, ${nextClass.class_time?.slice(0, 5)}` : 'Nenhuma aula agendada'}</p>
            </div>
          </article>
          <article className="student-summary-card">
            <div className="student-summary-icon green">✓</div>
            <div>
              <span>Atividades pendentes</span>
              <strong>{pending.length}</strong>
              <a href="/student/activities">Ver atividades</a>
            </div>
          </article>
          <article className="student-summary-card progress-card">
            <div className="student-progress-ring" style={{ background: `conic-gradient(#43a95b 0 ${progress * 3.6}deg, #e8edf5 ${progress * 3.6}deg 360deg)` }}>
              <strong>{progress}%</strong>
            </div>
            <div>
              <span>Seu progresso</span>
              <strong>{progress >= 70 ? 'Parabéns!' : 'Continue assim!'}</strong>
              <p>{activities.length ? `${completed} de ${activities.length} atividades` : 'Sem atividades ainda'}</p>
            </div>
          </article>
        </div>

        <section className="student-week-card">
          <div className="student-week-head">
            <h2>Esta semana</h2>
            <div className="student-week-actions">
              <button type="button">‹</button>
              <button type="button">Hoje</button>
              <button type="button">›</button>
            </div>
          </div>
          <div className="student-week-grid">
            <div className="student-time-spacer" />
            {weekDays.map((item) => (
              <div className={`student-week-day ${item.active ? 'active' : ''}`} key={item.key}>
                <span>{item.label}</span>
                <strong>{item.day}/{item.month}</strong>
              </div>
            ))}
            {timeRows.map((time) => (
              <div className="student-week-row" key={time}>
                <div className="student-time-label">{time}</div>
                {weekDays.map((dayItem) => {
                  const events = dayItem.items.filter((item) => item.class_time?.slice(0, 2) === time.slice(0, 2));
                  return (
                    <div className="student-week-cell" key={`${dayItem.key}-${time}`}>
                      {events.map((event) => (
                        <div className={`student-class-chip ${event.id === nextClass?.id ? 'selected' : ''}`} key={event.id}>
                          <strong>{event.subject || 'Aula'}</strong>
                          <small>{event.class_time?.slice(0, 5)}</small>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <section className="continue-card">
          <h2>Continuar estudando</h2>
          {continueItems.map((item) => (
            <div className="continue-row" key={item.title}>
              <div className={`continue-icon ${item.tone}`}>{item.tone === 'blue' ? '□' : '◇'}</div>
              <div>
                <strong>{item.title}</strong>
                <small>{item.note}</small>
              </div>
              <div className="continue-progress"><span style={{ width: `${item.progress}%` }} /></div>
              <em>{item.progress}%</em>
              <a href={item.tone === 'blue' ? '/student/lesson-history' : '/student/activities'}>Continuar</a>
            </div>
          ))}
        </section>
      </section>

      <aside className="student-side-panel">
        <button className="student-side-close" type="button" aria-label="Fechar">×</button>
        <div className="student-profile-card">
          <div className="student-photo">{firstName.slice(0, 1).toUpperCase()}</div>
          <div>
            <h2>{nextClass?.subject || student?.subject || 'Aula'}</h2>
            <p>{student?.full_name || 'Aluno'}</p>
          </div>
        </div>
        <div className="student-next-details">
          <p>{nextClass ? `${nextClass.class_date === todayKey ? 'Hoje' : formatDate(nextClass.class_date)} - ${nextClass.class_time?.slice(0, 5)}` : 'Sem próxima aula'}</p>
          <p>{nextClass?.duration_minutes || student?.duration_minutes || 60} minutos</p>
          <p>{nextClass?.subject || student?.subject || 'Matéria não definida'}</p>
        </div>
        {nextClass?.meeting_url ? (
          <a className="btn student side-primary" href={nextClass.meeting_url} target="_blank" rel="noreferrer">
            Entrar na aula
          </a>
        ) : (
          <button className="btn student side-primary" type="button" onClick={confirmNextClass} disabled={!nextClass || nextClass.student_confirmed}>
            {nextClass?.student_confirmed ? 'Confirmada' : 'Confirmar aula'}
          </button>
        )}
        <div className="student-today-list">
          <h3>Para hoje</h3>
          {pending.slice(0, 2).map((activity) => (
            <label className="student-today-task" key={activity.id}>
              <input type="checkbox" readOnly />
              <span>
                <strong>{activity.title}</strong>
                <small>{activity.due_date ? `Entrega até ${activity.due_date}` : 'Sem prazo definido'}</small>
              </span>
            </label>
          ))}
          {pending.length === 0 && <p className="muted">Nenhuma tarefa pendente para hoje.</p>}
        </div>
        <a className="student-material-link" href="/student/activities">Ver material da aula ›</a>
      </aside>
    </div>
  );
}
