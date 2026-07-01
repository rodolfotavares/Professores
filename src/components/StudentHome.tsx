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
  if (!date) return 'Data nÃ£o definida';
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date(`${date}T00:00:00`));
}

function reportSubject(report: LessonReport) {
  return report.class_schedules?.subject || report.students?.subject || 'Aula';
}

function scoreOfReport(report: LessonReport, index: number) {
  if (typeof report.learning_score === 'number') return Math.max(0, Math.min(100, report.learning_score));
  const text = `${report.learning_progress || ''} ${report.reinforcement_points || ''} ${report.detected_doubts || ''}`.toLowerCase();
  if (text.includes('dificuldade recorrente')) return Math.max(28, 58 - index * 2);
  if (text.includes('duvida') || text.includes('dificuldade')) return 60;
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
    const y = 100 - point.score;
    return `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
  const area = path ? `${path} L 100 100 L 0 100 Z` : '';
  const latest = evolution.points.at(-1)?.report;

  return (
    <section className="student-evolution-home-card">
      <div className="student-evolution-home-head">
        <div>
          <span>Evolucao do aluno</span>
          <h2>{studentName}</h2>
          <p>Analise baseada nos relatorios publicados pelo professor.</p>
        </div>
        <strong>{evolution.currentScore ? `${evolution.currentScore}%` : '--'}</strong>
      </div>
      <div className="student-evolution-home-metrics">
        <article><small>Aulas analisadas</small><b>{reports.length}</b></article>
        <article><small>Tendencia</small><b>{evolution.trend >= 0 ? `+${evolution.trend}` : evolution.trend}</b></article>
        <article><small>Pontos de atencao</small><b>{evolution.attention}</b></article>
      </div>
      <div className="student-evolution-chart-wrap">
        {evolution.points.length ? (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Grafico de evolucao do aluno">
            <path className="evolution-grid" d="M0 20H100 M0 40H100 M0 60H100 M0 80H100" />
            <path className="evolution-area" d={area} />
            <path className="evolution-line" d={path} />
            {evolution.points.map((point) => {
              const y = 100 - point.score;
              return (
                <g key={point.report.id}>
                  <circle cx={point.x} cy={y} r="2.6" />
                  <text x={point.x} y={Math.max(7, y - 7)}>{point.score}</text>
                </g>
              );
            })}
          </svg>
        ) : (
          <div className="student-evolution-empty">A evolucao aparece aqui quando houver relatorios de aula.</div>
        )}
      </div>
      <div className="student-evolution-labels">
        {evolution.points.map((point) => <span key={point.report.id}>{point.label}<small>{point.subject}</small></span>)}
      </div>
      <div className="student-evolution-ai-box">
        <strong>Leitura da IA</strong>
        <p>{latest?.learning_evidence || latest?.learning_progress || 'A IA ainda precisa de mais relatorios para medir a evolucao com seguranca.'}</p>
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
    { title: student?.subject || 'Aulas', note: 'Conteudo da proxima aula', progress: progress || 35, tone: 'blue' },
    { title: 'Historico inteligente', note: `${reports.length} relatorio${reports.length === 1 ? '' : 's'} analisado${reports.length === 1 ? '' : 's'}`, progress: Math.min(100, reports.length * 12), tone: 'green' },
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
          <h1>OlÃ¡, {firstName}</h1>
          <p>Sua semana de estudos</p>
        </div>

        <div className="student-summary-grid">
          <article className="student-summary-card">
            <div className="student-summary-icon">â–£</div>
            <div>
              <span>PrÃ³xima aula</span>
              <strong>{nextClass?.subject || student?.subject || 'Aula'}</strong>
              <p>{nextClass ? `${nextClass.class_date === todayKey ? 'Hoje' : formatDate(nextClass.class_date)}, ${nextClass.class_time?.slice(0, 5)}` : 'Nenhuma aula agendada'}</p>
            </div>
          </article>
          <article className="student-summary-card">
            <div className="student-summary-icon green">âœ“</div>
            <div>
              <span>Aulas registradas</span>
              <strong>{classes.length}</strong>
              <a href="/student/lesson-history">Ver historico</a>
            </div>
          </article>
          <article className="student-summary-card progress-card">
            <div className="student-progress-ring" style={{ background: `conic-gradient(#43a95b 0 ${progress * 3.6}deg, #e8edf5 ${progress * 3.6}deg 360deg)` }}>
              <strong>{progress}%</strong>
            </div>
            <div>
              <span>Seu progresso</span>
              <strong>{progress >= 70 ? 'ParabÃ©ns!' : 'Continue assim!'}</strong>
              <p>{reports.length ? `${reports.length} relatorios analisados` : 'Aguardando relatorios'}</p>
            </div>
          </article>
        </div>

        <section className="student-week-card">
          <div className="student-week-head">
            <h2>Esta semana</h2>
            <div className="student-week-actions">
              <button type="button">â€¹</button>
              <button type="button">Hoje</button>
              <button type="button">â€º</button>
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
              <div className={`continue-icon ${item.tone}`}>{item.tone === 'blue' ? 'â–¡' : 'â—‡'}</div>
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
        <button className="student-side-close" type="button" aria-label="Fechar">Ã—</button>
        <div className="student-profile-card">
          <div className="student-photo">{firstName.slice(0, 1).toUpperCase()}</div>
          <div>
            <h2>{nextClass?.subject || student?.subject || 'Aula'}</h2>
            <p>{student?.full_name || 'Aluno'}</p>
          </div>
        </div>
        <div className="student-next-details">
          <p>{nextClass ? `${nextClass.class_date === todayKey ? 'Hoje' : formatDate(nextClass.class_date)} - ${nextClass.class_time?.slice(0, 5)}` : 'Sem prÃ³xima aula'}</p>
          <p>{nextClass?.duration_minutes || student?.duration_minutes || 60} minutos</p>
          <p>{nextClass?.subject || student?.subject || 'MatÃ©ria nÃ£o definida'}</p>
        </div>
        <button className="btn student side-primary" type="button" onClick={confirmNextClass} disabled={!nextClass || nextClass.student_confirmed}>
          {nextClass?.student_confirmed ? 'Confirmada' : 'Confirmar aula'}
        </button>
        <div className="student-today-list">
          <h3>Para hoje</h3>
          <label className="student-today-task">
            <input type="checkbox" readOnly />
            <span>
              <strong>Revisar a ultima aula</strong>
              <small>Use o historico inteligente para acompanhar sua evolucao.</small>
            </span>
          </label>
          <label className="student-today-task">
            <input type="checkbox" readOnly />
            <span>
              <strong>Preparar duvidas</strong>
              <small>Anote o que quer perguntar ao professor na proxima aula.</small>
            </span>
          </label>
        </div>
        <a className="student-material-link" href="/student/lesson-history">Ver historico da aula</a>
      </aside>
    </div>
  );
}

