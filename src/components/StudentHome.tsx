'use client';

import { useEffect, useState } from 'react';
import { StatusMessage } from '@/components/PanelState';
import { apiFetch } from '@/lib/fetcher';
import type { ClassSchedule, LessonReport, Student } from '@/types';

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

function reportSubject(report: LessonReport) {
  return report.class_schedules?.subject || report.students?.subject || 'Aula';
}

function scoreOfReport(report: LessonReport, index: number) {
  if (typeof report.learning_score === 'number') return Math.max(0, Math.min(100, report.learning_score));
  const text = `${report.learning_progress || ''} ${report.reinforcement_points || ''} ${report.detected_doubts || ''}`.toLowerCase();
  if (text.includes('dificuldade recorrente')) return Math.max(28, 58 - index * 2);
  if (text.includes('duvida') || text.includes('dúvida') || text.includes('dificuldade')) return 60;
  return Math.min(90, 62 + index * 5);
}

function buildStudentEvolution(reports: LessonReport[]) {
  const chronological = [...reports]
    .sort((a, b) => new Date(a.published_at || a.updated_at).getTime() - new Date(b.published_at || b.updated_at).getTime())
    .slice(-8);
  const points = chronological.map((report, index) => ({
    report,
    score: scoreOfReport(report, index),
    label: `Aula ${index + 1}`,
    subject: reportSubject(report),
    x: chronological.length === 1 ? 50 : (index / (chronological.length - 1)) * 100,
  }));
  const currentScore = points.at(-1)?.score || 0;
  const previousScore = points.at(-2)?.score || currentScore;
  const trend = currentScore - previousScore;
  const attention = reports.filter((report) => `${report.reinforcement_points || ''} ${report.detected_doubts || ''}`.toLowerCase().includes('dificuldade')).length;
  return { points, currentScore, trend, attention };
}

function StudentEvolutionCard({ reports, studentName }: { reports: LessonReport[]; studentName: string }) {
  const evolution = buildStudentEvolution(reports);
  const path = evolution.points.map((point, index) => {
    const y = 52 - (point.score / 100) * 44;
    return `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
  const area = path ? `${path} L 100 56 L 0 56 Z` : '';
  const latest = evolution.points.at(-1)?.report;

  return (
    <section className="student-evolution-home-card">
      <div className="student-evolution-home-head">
        <div>
          <span>Evolução do aluno</span>
          <h2>{studentName}</h2>
          <p>Análise baseada nos relatórios publicados pelo professor.</p>
        </div>
        <strong>{evolution.currentScore ? `${evolution.currentScore}%` : '--'}</strong>
      </div>
      <div className="student-evolution-home-metrics">
        <article><small>Aulas analisadas</small><b>{reports.length}</b></article>
        <article><small>Tendência</small><b>{evolution.trend >= 0 ? `+${evolution.trend}` : evolution.trend}</b></article>
        <article><small>Pontos de atenção</small><b>{evolution.attention}</b></article>
      </div>
      <div className="student-evolution-chart-wrap">
        {evolution.points.length ? (
          <svg viewBox="0 0 100 56" preserveAspectRatio="none" aria-label="Gráfico de evolução do aluno">
            <path className="evolution-grid" d="M0 8H100 M0 20H100 M0 32H100 M0 44H100" />
            <path className="evolution-area" d={area} />
            <path className="evolution-line" d={path} />
            {evolution.points.map((point) => {
              const y = 52 - (point.score / 100) * 44;
              return (
                <g key={point.report.id}>
                  <circle cx={point.x} cy={y} r="1.8" />
                  <text className="score-label" x={point.x} y={Math.max(5, y - 4)}>{point.score}%</text>
                  <text className="lesson-label" x={point.x} y="54">{point.label}</text>
                </g>
              );
            })}
          </svg>
        ) : (
          <div className="student-evolution-empty">A evolução aparece aqui quando houver relatórios de aula.</div>
        )}
      </div>
      <div className="student-evolution-labels">
        {evolution.points.map((point) => <span key={point.report.id}>{point.label}<small>{point.subject}</small></span>)}
      </div>
      <div className="student-evolution-ai-box">
        <strong>Leitura da IA</strong>
        <p>{latest?.learning_evidence || latest?.learning_progress || 'A IA ainda precisa de mais relatórios para medir a evolução com segurança.'}</p>
      </div>
    </section>
  );
}
export function StudentHome() {
  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [reports, setReports] = useState<LessonReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const [me, schedule, reportData] = await Promise.all([
        apiFetch<{ student: Student }>('/api/student/me'),
        apiFetch<{ classes: ClassSchedule[] }>('/api/student/schedule'),
        apiFetch<{ reports: LessonReport[] }>('/api/student/lesson-reports'),
      ]);
      setStudent(me.student);
      setClasses(schedule.classes);
      setReports(reportData.reports);
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
  const mobileUpcomingClasses = sortedClasses.filter((item) => item.status === 'scheduled' && item.class_date >= todayKey).slice(0, 6);
  const evolution = buildStudentEvolution(reports);
  const progress = evolution.currentScore;
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
    { title: student?.subject || 'Aulas', note: 'Conteúdo da próxima aula', progress: progress || 35, tone: 'blue' },
    { title: 'Histórico inteligente', note: `${reports.length} relatório${reports.length === 1 ? '' : 's'} analisado${reports.length === 1 ? '' : 's'}`, progress: Math.min(100, reports.length * 12), tone: 'green' },
  ];

  async function confirmNextClass() {
    if (!nextClass || nextClass.student_confirmed) return;
    await apiFetch(`/api/student/schedule/${nextClass.id}/confirm`, { method: 'PATCH' });
    await load();
  }

  async function handleNextClassAction() {
    if (!nextClass) return;
    if (nextClass.meeting_url) {
      window.open(nextClass.meeting_url, '_blank', 'noopener,noreferrer');
      return;
    }
    await confirmNextClass();
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
              <span>Aulas registradas</span>
              <strong>{classes.length}</strong>
              <a href="/student/lesson-history">Ver histórico</a>
            </div>
          </article>
          <article className="student-summary-card progress-card">
            <div className="student-progress-ring" style={{ background: `conic-gradient(#43a95b 0 ${progress * 3.6}deg, #e8edf5 ${progress * 3.6}deg 360deg)` }}>
              <strong>{progress}%</strong>
            </div>
            <div>
              <span>Seu progresso</span>
              <strong>{progress >= 70 ? 'Parabéns!' : 'Continue assim!'}</strong>
              <p>{reports.length ? `${reports.length} relatórios analisados` : 'Aguardando relatórios'}</p>
            </div>
          </article>
        </div>

        <section className="student-mobile-agenda-card" aria-label="Agenda simplificada">
          <div className="mobile-section-head">
            <div>
              <span>Agenda</span>
              <h2>Próximas aulas</h2>
            </div>
            <button className="side-primary" type="button" onClick={confirmNextClass} disabled={!nextClass || nextClass.student_confirmed}>
              {nextClass?.student_confirmed ? 'Confirmada' : 'Confirmar'}
            </button>
          </div>
          <div className="mobile-agenda-list">
            {mobileUpcomingClasses.length === 0 && (
              <div className="mobile-empty-state">
                <strong>Nenhuma aula futura</strong>
                <span>Quando o professor marcar uma aula, ela aparecerá aqui.</span>
              </div>
            )}
            {mobileUpcomingClasses.map((item) => (
              <article className={`mobile-agenda-item ${item.id === nextClass?.id ? 'active' : ''}`} key={item.id}>
                <span className="mobile-date-pill">
                  <strong>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit' }).format(new Date(`${item.class_date}T00:00:00`))}</strong>
                  <small>{new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(new Date(`${item.class_date}T00:00:00`)).replace('.', '')}</small>
                </span>
                <span>
                  <strong>{item.subject || student?.subject || 'Aula particular'}</strong>
                  <small>{item.class_time?.slice(0, 5)} • {item.duration_minutes || 60} min</small>
                </span>
                <em>{item.student_confirmed ? 'OK' : 'Pendente'}</em>
              </article>
            ))}
          </div>
        </section>

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

        <StudentEvolutionCard reports={reports} studentName={student?.full_name || firstName} />

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
              <a href="/student/lesson-history">Continuar</a>
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
          <p>{nextClass?.meeting_url ? 'Link do Meet disponível' : 'Link do Meet ainda não disponível'}</p>
        </div>
        <button className="btn student side-primary" type="button" onClick={handleNextClassAction} disabled={!nextClass || (!nextClass.meeting_url && nextClass.student_confirmed)}>
          {nextClass?.meeting_url ? 'Entrar na aula' : nextClass?.student_confirmed ? 'Confirmada' : 'Confirmar aula'}
        </button>
        <div className="student-today-list">
          <h3>Para hoje</h3>
          <label className="student-today-task">
            <input type="checkbox" readOnly />
            <span>
              <strong>Revisar a última aula</strong>
              <small>Use o histórico inteligente para acompanhar sua evolução.</small>
            </span>
          </label>
          <label className="student-today-task">
            <input type="checkbox" readOnly />
            <span>
              <strong>Preparar dúvidas</strong>
              <small>Anote o que quer perguntar ao professor na próxima aula.</small>
            </span>
          </label>
        </div>
        <a className="student-material-link" href="/student/lesson-history">Ver histórico da aula</a>
      </aside>
    </div>
  );
}

