'use client';

import { useEffect, useMemo, useState } from 'react';
import { GlassCard, MetricCard, StatusBadge } from '@/components/AppShell';
import { EmptyState, StatusMessage } from '@/components/PanelState';
import { apiFetch } from '@/lib/fetcher';
import type { Activity, ActivitySubmission, ClassSchedule, Student } from '@/types';

function usePanelLoad(load: () => Promise<void>, interval = 15000) {
  useEffect(() => {
    load();
    const timer = window.setInterval(load, interval);
    return () => window.clearInterval(timer);
  }, []);
}

function SectionIntro({ title, text }: { title: string; text: string }) {
  return (
    <div className="section-intro">
      <span className="eyebrow">Lumina</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function statusTone(status?: string) {
  if (status === 'completed' || status === 'corrected' || status === 'active') return 'success';
  if (status === 'scheduled' || status === 'submitted' || status === 'pending') return 'warning';
  return 'default';
}

export function TeacherClassesPanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar turmas.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  const subjects = Array.from(new Set(students.map((student) => student.subject || 'Sem materia')));
  const scheduled = classes.filter((item) => item.status === 'scheduled').length;

  return (
    <div className="stack portal-tab">
      <SectionIntro title="Turmas" text="Organizacao visual das materias, alunos ativos e proximas aulas." />
      <StatusMessage error={error} loading={loading} />
      <div className="grid grid-3">
        <MetricCard title="Materias" value={subjects.length} note="turmas em acompanhamento" />
        <MetricCard title="Alunos ativos" value={students.filter((student) => student.status === 'active').length} note="com agenda vinculada" />
        <MetricCard title="Aulas futuras" value={scheduled} note="pendentes na agenda" />
      </div>
      {!loading && students.length === 0 && <EmptyState title="Nenhuma turma formada" text="Cadastre alunos para montar suas turmas automaticamente." />}
      <div className="portal-card-grid">
        {subjects.map((subject) => {
          const group = students.filter((student) => (student.subject || 'Sem materia') === subject);
          return (
            <GlassCard className="portal-summary-card" key={subject}>
              <div className="glass-card-head">
                <strong>{subject}</strong>
                <StatusBadge tone="success">{group.length} alunos</StatusBadge>
              </div>
              <div className="mini-list">
                {group.map((student) => (
                  <span key={student.id}>
                    <strong>{student.full_name}</strong>
                    <small>{student.classes_per_week || 0} aulas/semana - {student.class_time || 'sem horario'}</small>
                  </span>
                ))}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

export function TeacherGradesPanel() {
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const data = await apiFetch<{ submissions: ActivitySubmission[] }>('/api/teacher/submissions');
      setSubmissions(data.submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar notas.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  const corrected = submissions.filter((item) => item.status === 'corrected');
  const average = corrected.length ? Math.round(corrected.reduce((sum, item) => sum + Number(item.grade || 0), 0) / corrected.length) : 0;

  return (
    <div className="stack portal-tab">
      <SectionIntro title="Notas" text="Acompanhe entregas corrigidas, pendentes e desempenho medio." />
      <StatusMessage error={error} loading={loading} />
      <div className="grid grid-3">
        <MetricCard title="Entregas" value={submissions.length} note="recebidas dos alunos" />
        <MetricCard title="Corrigidas" value={corrected.length} note="com nota lancada" />
        <MetricCard title="Media" value={average || '-'} note="desempenho geral" />
      </div>
      {!loading && submissions.length === 0 && <EmptyState title="Nenhuma entrega ainda" text="As respostas enviadas pelos alunos aparecem aqui." />}
      <GlassCard className="data-table-card">
        <div className="data-table">
          {submissions.map((submission) => (
            <div className="data-row" key={submission.id}>
              <span><strong>{submission.activities?.title || 'Atividade'}</strong><small>{submission.students?.full_name || 'Aluno'}</small></span>
              <span>{submission.grade != null ? submission.grade : 'Aguardando'}</span>
              <StatusBadge tone={statusTone(submission.status)}>{submission.status}</StatusBadge>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

export function TeacherFrequencyPanel() {
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const data = await apiFetch<{ classes: ClassSchedule[] }>('/api/teacher/schedule');
      setClasses(data.classes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar frequencia.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  const completed = classes.filter((item) => item.status === 'completed').length;
  const absences = classes.filter((item) => item.status === 'absence').length;
  const confirmed = classes.filter((item) => item.student_confirmed).length;

  return (
    <div className="stack portal-tab">
      <SectionIntro title="Frequencia" text="Controle presencas, faltas e confirmacoes de aula." />
      <StatusMessage error={error} loading={loading} />
      <div className="grid grid-3">
        <MetricCard title="Aulas realizadas" value={completed} note="marcadas como concluidas" />
        <MetricCard title="Confirmacoes" value={confirmed} note="confirmadas por alunos" />
        <MetricCard title="Faltas" value={absences} note="registradas na agenda" />
      </div>
      {!loading && classes.length === 0 && <EmptyState title="Sem frequencia ainda" text="A frequencia nasce da agenda de aulas." />}
      <GlassCard className="timeline-card">
        {classes.slice(0, 12).map((item) => (
          <div className="timeline-row" key={item.id}>
            <span />
            <div>
              <strong>{item.students?.full_name || 'Aluno'}</strong>
              <small>{item.class_date} as {item.class_time}</small>
            </div>
            <StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

export function TeacherSettingsPanel() {
  const [profile, setProfile] = useState<{ full_name?: string; access_code?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const data = await apiFetch<{ profile: { full_name?: string; access_code?: string } }>('/api/teacher/profile');
      setProfile(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar configuracoes.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load, 30000);

  return (
    <div className="stack portal-tab">
      <SectionIntro title="Configuracoes" text="Dados essenciais da conta e codigo para vincular alunos." />
      <StatusMessage error={error} loading={loading} />
      <div className="grid grid-2">
        <GlassCard className="portal-summary-card">
          <span className="eyebrow">Professor</span>
          <h2>{profile?.full_name || 'Professor'}</h2>
          <p className="muted">Seu portal esta conectado ao Supabase e sincroniza alunos, agenda, atividades e mensagens.</p>
        </GlassCard>
        <GlassCard className="portal-summary-card access-code-card">
          <span className="eyebrow">Codigo do professor</span>
          <h2>{profile?.access_code || '...'}</h2>
          <p className="muted">Use este codigo no cadastro do aluno para criar o vinculo automaticamente.</p>
        </GlassCard>
      </div>
    </div>
  );
}

export function StudentClassesPanel() {
  return <StudentScheduleSummary mode="classes" />;
}

export function StudentFrequencyPanel() {
  return <StudentScheduleSummary mode="frequency" />;
}

function StudentScheduleSummary({ mode }: { mode: 'classes' | 'frequency' }) {
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const data = await apiFetch<{ classes: ClassSchedule[] }>('/api/student/schedule');
      setClasses(data.classes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar aulas.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  const completed = classes.filter((item) => item.status === 'completed').length;
  const confirmed = classes.filter((item) => item.student_confirmed).length;
  const scheduled = classes.filter((item) => item.status === 'scheduled').length;

  return (
    <div className="stack portal-tab">
      <SectionIntro
        title={mode === 'classes' ? 'Minhas aulas' : 'Frequencia'}
        text={mode === 'classes' ? 'Veja suas proximas aulas e materias.' : 'Acompanhe presencas e confirmacoes.'}
      />
      <StatusMessage error={error} loading={loading} />
      <div className="grid grid-3">
        <MetricCard title="Agendadas" value={scheduled} note="proximos encontros" />
        <MetricCard title="Confirmadas" value={confirmed} note="confirmadas por voce" />
        <MetricCard title="Realizadas" value={completed} note="concluidas" />
      </div>
      {!loading && classes.length === 0 && <EmptyState title="Nenhuma aula encontrada" text="Quando o professor organizar sua agenda, ela aparece aqui." />}
      <GlassCard className="timeline-card">
        {classes.slice(0, 12).map((item) => (
          <div className="timeline-row" key={item.id}>
            <span />
            <div>
              <strong>{item.subject || 'Aula'}</strong>
              <small>{item.class_date} as {item.class_time}</small>
            </div>
            <StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

export function StudentGradesPanel() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const data = await apiFetch<{ activities: Activity[]; submissions: ActivitySubmission[] }>('/api/student/activities');
      setActivities(data.activities);
      setSubmissions(data.submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar notas.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  const corrected = submissions.filter((item) => item.status === 'corrected');
  const average = corrected.length ? Math.round(corrected.reduce((sum, item) => sum + Number(item.grade || 0), 0) / corrected.length) : 0;

  return (
    <div className="stack portal-tab">
      <SectionIntro title="Notas" text="Veja notas, feedbacks e atividades ainda aguardando correcao." />
      <StatusMessage error={error} loading={loading} />
      <div className="grid grid-3">
        <MetricCard title="Atividades" value={activities.length} note="publicadas" />
        <MetricCard title="Corrigidas" value={corrected.length} note="com feedback" />
        <MetricCard title="Media" value={average || '-'} note="resultado atual" />
      </div>
      {!loading && submissions.length === 0 && <EmptyState title="Sem notas ainda" text="Entregue atividades para receber correcoes do professor." />}
      <GlassCard className="data-table-card">
        <div className="data-table">
          {submissions.map((submission) => (
            <div className="data-row" key={submission.id}>
              <span><strong>{submission.activities?.title || 'Atividade'}</strong><small>{submission.feedback || 'Sem feedback ainda'}</small></span>
              <span>{submission.grade != null ? submission.grade : 'Aguardando'}</span>
              <StatusBadge tone={statusTone(submission.status)}>{submission.status}</StatusBadge>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

export function StudentMaterialsPanel() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const data = await apiFetch<{ activities: Activity[] }>('/api/student/activities');
      setActivities(data.activities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar materiais.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  const files = activities.filter((activity) => activity.file_url);

  return (
    <div className="stack portal-tab">
      <SectionIntro title="Materiais" text="Arquivos enviados pelo professor ficam reunidos aqui." />
      <StatusMessage error={error} loading={loading} />
      <div className="grid grid-3">
        <MetricCard title="Arquivos" value={files.length} note="disponiveis" />
        <MetricCard title="Materias" value={new Set(activities.map((activity) => activity.subject || 'Geral')).size} note="com conteudo" />
        <MetricCard title="Atividades" value={activities.length} note="vinculadas" />
      </div>
      {!loading && files.length === 0 && <EmptyState title="Nenhum material ainda" text="Quando o professor anexar arquivos, eles aparecem aqui." />}
      <div className="portal-card-grid">
        {files.map((activity) => (
          <GlassCard className="portal-summary-card" key={activity.id}>
            <div className="glass-card-head">
              <strong>{activity.title}</strong>
              <StatusBadge tone="warning">{activity.subject || 'Geral'}</StatusBadge>
            </div>
            <p className="muted">{activity.description || 'Material da atividade.'}</p>
            <a className="file-link" href={activity.file_url || '#'} target="_blank">Abrir material</a>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

export function StudentSettingsPanel() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const data = await apiFetch<{ student: Student }>('/api/student/me');
      setStudent(data.student);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar perfil.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load, 30000);

  const days = useMemo(() => (student?.days_of_week || []).join(', ') || 'Nao definido', [student]);

  return (
    <div className="stack portal-tab">
      <SectionIntro title="Perfil" text="Informacoes do seu cadastro e vinculo com o professor." />
      <StatusMessage error={error} loading={loading} />
      <div className="grid grid-2">
        <GlassCard className="portal-summary-card">
          <span className="eyebrow">Aluno</span>
          <h2>{student?.full_name || 'Aluno'}</h2>
          <p className="muted">{student?.email || 'E-mail nao informado'}</p>
          <StatusBadge tone={statusTone(student?.status)}>{student?.status || 'ativo'}</StatusBadge>
        </GlassCard>
        <GlassCard className="portal-summary-card">
          <span className="eyebrow">Aulas</span>
          <h2>{student?.subject || 'Materia nao definida'}</h2>
          <p className="muted">Dias: {days}</p>
          <p className="muted">Horario: {student?.class_time || 'Nao definido'}</p>
        </GlassCard>
      </div>
    </div>
  );
}
