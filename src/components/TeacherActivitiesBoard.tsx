'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { StatusMessage } from '@/components/PanelState';
import { apiFetch } from '@/lib/fetcher';
import type { Activity, ActivitySubmission, Student } from '@/types';

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

function statusFor(activity: Activity, submissions: ActivitySubmission[]) {
  const related = submissions.filter((submission) => submission.activity_id === activity.id);
  if (related.some((submission) => submission.status === 'submitted')) return 'Para corrigir';
  if (related.some((submission) => submission.status === 'corrected')) return 'Concluída';
  return activity.visible_to_student ? 'Publicada' : 'Em andamento';
}

function statusClass(label: string) {
  if (label === 'Para corrigir') return 'warning';
  if (label === 'Concluída' || label === 'Publicada') return 'success';
  return 'neutral';
}

function SearchGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function TeacherActivitiesBoard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'review' | 'progress' | 'done'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', subject: '', student_id: '', due_date: '' });
  const [file, setFile] = useState<File | null>(null);
  const [grade, setGrade] = useState('8.5');
  const [feedback, setFeedback] = useState('Ótimo trabalho! Continue praticando e revise os pontos marcados.');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const [studentData, activityData, submissionData] = await Promise.all([
        apiFetch<{ students: Student[] }>('/api/teacher/students'),
        apiFetch<{ activities: Activity[] }>('/api/teacher/activities'),
        apiFetch<{ submissions: ActivitySubmission[] }>('/api/teacher/submissions'),
      ]);
      setStudents(studentData.students);
      setActivities(activityData.activities);
      setSubmissions(submissionData.submissions);
      if (!selectedActivityId && activityData.activities[0]) setSelectedActivityId(activityData.activities[0].id);
      if (!selectedSubmissionId && submissionData.submissions[0]) setSelectedSubmissionId(submissionData.submissions[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar atividades.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  const selectedActivity = activities.find((activity) => activity.id === selectedActivityId) || activities[0] || null;
  const activitySubmissions = submissions.filter((submission) => submission.activity_id === selectedActivity?.id);
  const selectedSubmission =
    submissions.find((submission) => submission.id === selectedSubmissionId) ||
    activitySubmissions[0] ||
    null;
  const selectedStudent = students.find((student) => student.id === selectedSubmission?.student_id || student.id === selectedActivity?.student_id) || null;
  const selectedSubmissionIndex = selectedSubmission ? Math.max(0, activitySubmissions.findIndex((item) => item.id === selectedSubmission.id)) : -1;

  useEffect(() => {
    if (!selectedSubmission) return;
    setGrade(selectedSubmission.grade != null ? String(selectedSubmission.grade) : '8.5');
    setFeedback(selectedSubmission.feedback || 'Ótimo trabalho! Continue praticando e revise os pontos marcados.');
  }, [selectedSubmission?.id]);

  const rows = useMemo(() => {
    return activities.map((activity) => {
      const related = submissions.filter((submission) => submission.activity_id === activity.id);
      const delivered = related.length;
      const total = activity.student_id ? 1 : Math.max(students.length, delivered, 1);
      const progress = Math.round((delivered / total) * 100);
      const label = statusFor(activity, submissions);
      return { activity, related, delivered, total, progress, label };
    });
  }, [activities, students.length, submissions]);

  const filteredRows = rows.filter(({ activity, label }) => {
    const matchesQuery = `${activity.title} ${activity.subject || ''}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'review' && label === 'Para corrigir') ||
      (filter === 'progress' && label === 'Em andamento') ||
      (filter === 'done' && (label === 'Concluída' || label === 'Publicada'));
    return matchesQuery && matchesFilter;
  });

  async function uploadFile(fileToUpload: File) {
    const body = new FormData();
    body.append('file', fileToUpload);
    return apiFetch<{ url: string }>('/api/upload', { method: 'POST', body });
  }

  async function createActivity(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const uploaded = file ? await uploadFile(file) : null;
      await apiFetch('/api/teacher/activities', {
        method: 'POST',
        body: JSON.stringify({ ...form, points: 10, student_id: form.student_id || undefined, file_url: uploaded?.url }),
      });
      setForm({ title: '', description: '', subject: '', student_id: '', due_date: '' });
      setFile(null);
      setIsCreateOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar atividade.');
    } finally {
      setSaving(false);
    }
  }

  async function correctSelected() {
    if (!selectedSubmission) return;
    const gradeValue = Number(grade);
    if (Number.isNaN(gradeValue) || gradeValue < 0 || gradeValue > 10) {
      setError('A nota precisa estar entre 0 e 10.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/api/teacher/submissions/${selectedSubmission.id}/correct`, {
        method: 'PATCH',
        body: JSON.stringify({ grade: gradeValue, feedback }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao devolver atividade.');
    } finally {
      setSaving(false);
    }
  }

  function selectActivity(activity: Activity, related: ActivitySubmission[]) {
    setSelectedActivityId(activity.id);
    setSelectedSubmissionId(related[0]?.id || '');
    setIsCorrectionOpen(true);
  }

  function moveSubmission(direction: -1 | 1) {
    if (!activitySubmissions.length) return;
    const nextIndex = (selectedSubmissionIndex + direction + activitySubmissions.length) % activitySubmissions.length;
    setSelectedSubmissionId(activitySubmissions[nextIndex].id);
  }

  return (
    <div className="activities-reference-page">
      <section className="activities-reference-main">
        <div className="activities-reference-header">
          <div>
            <h1>Atividades</h1>
            <p>Crie, acompanhe e corrija as entregas dos alunos.</p>
          </div>
          <button className="new-student-button" type="button" onClick={() => setIsCreateOpen((current) => !current)}>
            <span>+</span> Criar atividade
          </button>
        </div>
        <StatusMessage error={error} loading={loading} />
        {isCreateOpen && (
          <form className="activity-create-panel" onSubmit={createActivity}>
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Título da atividade" required />
            <input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Matéria" />
            <select value={form.student_id} onChange={(event) => setForm({ ...form, student_id: event.target.value })}>
              <option value="">Todos os alunos</option>
              {students.map((student) => <option value={student.id} key={student.id}>{student.full_name}</option>)}
            </select>
            <input type="date" value={form.due_date} onChange={(event) => setForm({ ...form, due_date: event.target.value })} />
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Descrição" />
            <input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            <button className="side-primary" disabled={saving}>{saving ? 'Criando...' : 'Publicar atividade'}</button>
          </form>
        )}
        <div className="activities-reference-tools">
          <label className="students-search">
            <SearchGlyph />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar atividades" />
          </label>
          <div className="activity-filter-tabs">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')} type="button">Todas</button>
            <button className={filter === 'review' ? 'active' : ''} onClick={() => setFilter('review')} type="button">Para corrigir</button>
            <button className={filter === 'progress' ? 'active' : ''} onClick={() => setFilter('progress')} type="button">Em andamento</button>
            <button className={filter === 'done' ? 'active' : ''} onClick={() => setFilter('done')} type="button">Concluídas</button>
          </div>
        </div>
        <div className="activity-table">
          <div className="activity-table-head">
            <span>Atividade</span>
            <span>Turma / Alunos</span>
            <span>Entrega</span>
            <span>Status</span>
            <span>Progresso</span>
            <span>Ação</span>
          </div>
          {filteredRows.map(({ activity, related, delivered, total, progress, label }, index) => (
            <button
              type="button"
              className={`activity-table-row ${activity.id === selectedActivity?.id ? 'selected' : ''}`}
              key={activity.id}
              onClick={() => selectActivity(activity, related)}
            >
              <span className={`activity-doc-icon tone-${index % 4}`}>▤</span>
              <span className="activity-title-cell"><strong>{activity.title}</strong><small>{activity.description || 'Lista de exercícios'}</small></span>
              <span><strong>{activity.students?.full_name || 'Todos'}</strong><small>{activity.student_id ? '1 aluno' : `${Math.max(students.length, 1)} alunos`}</small></span>
              <span><strong>{activity.due_date ? new Date(`${activity.due_date}T00:00:00`).toLocaleDateString('pt-BR') : 'Sem prazo'}</strong><small>23:59</small></span>
              <span><em className={`activity-status ${statusClass(label)}`}>{label}</em></span>
              <span className="activity-progress-cell"><small>{delivered}/{total} entregues</small><i><b style={{ width: `${progress}%` }} /></i></span>
              <span className="activity-row-action">{label === 'Para corrigir' ? 'Corrigir' : 'Ver'}</span>
            </button>
          ))}
        </div>
      </section>

      <aside className={`activity-correction-panel ${isCorrectionOpen ? '' : 'is-closed'}`}>
        <button className="student-side-close" type="button" aria-label="Fechar" onClick={() => setIsCorrectionOpen(false)}>×</button>
        {!isCorrectionOpen ? (
          <button className="reopen-panel-button" type="button" onClick={() => setIsCorrectionOpen(true)}>Abrir correção</button>
        ) : (
          <>
            <h2>Corrigir atividade</h2>
            <p>{selectedActivity?.title || 'Selecione uma atividade'}</p>
            <div className="correction-selector-row">
              <button type="button" className="correction-student-select">
                <span>{initials(selectedStudent?.full_name || selectedSubmission?.students?.full_name)}</span>
                {selectedStudent?.full_name || selectedSubmission?.students?.full_name || 'Aluno'}
              </button>
              <div className="correction-counter">
                <button type="button" onClick={() => moveSubmission(-1)}>‹</button>
                <strong>{selectedSubmissionIndex >= 0 ? selectedSubmissionIndex + 1 : 0} de {Math.max(activitySubmissions.length, 1)}</strong>
                <button type="button" onClick={() => moveSubmission(1)}>›</button>
              </div>
            </div>
            <div className="submitted-file-preview">
              <strong>Arquivo enviado</strong>
              <div>
                {selectedSubmission?.answer_file_url ? (
                  <a href={selectedSubmission.answer_file_url} target="_blank">Abrir arquivo enviado pelo aluno</a>
                ) : (
                  <p>{selectedSubmission?.answer_text || 'A resposta do aluno aparecerá aqui quando houver entrega.'}</p>
                )}
              </div>
            </div>
            <label className="grade-control">
              <span>Nota</span>
              <div>
                <button type="button" onClick={() => setGrade(String(Math.max(0, Number(grade || 0) - 0.5)))}>−</button>
                <input value={grade} onChange={(event) => setGrade(event.target.value)} />
                <button type="button" onClick={() => setGrade(String(Math.min(10, Number(grade || 0) + 0.5)))}>+</button>
                <em>/ 10</em>
              </div>
            </label>
            <label className="feedback-control">
              <span>Feedback para o aluno</span>
              <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} maxLength={500} />
              <small>{feedback.length}/500</small>
            </label>
            <div className="correction-actions">
              <button className="outline-action" type="button" onClick={() => setError('Rascunho mantido nesta tela. Para concluir, clique em Devolver ao aluno.')}>Salvar rascunho</button>
              <button className="side-primary" type="button" onClick={correctSelected} disabled={!selectedSubmission || saving}>{saving ? 'Enviando...' : 'Devolver ao aluno'}</button>
            </div>
            <div className="correction-success-note">O aluno receberá sua nota e feedback no portal do aluno.</div>
          </>
        )}
      </aside>
    </div>
  );
}
