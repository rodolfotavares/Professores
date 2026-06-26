'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { StatusMessage } from '@/components/PanelState';
import { apiFetch } from '@/lib/fetcher';
import type { ClassSchedule, LessonReport, LessonReportStatus } from '@/types';

const statusLabels: Record<LessonReportStatus, string> = {
  DRAFT: 'Rascunho',
  APPROVED: 'Aprovado',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

const fields = [
  ['title', 'Título'],
  ['summary', 'Resumo'],
  ['taught_content', 'Conteúdo ensinado'],
  ['student_questions', 'Dúvidas identificadas'],
  ['reinforcement_points', 'Pontos para reforçar'],
  ['exercises_done', 'Exercícios realizados'],
  ['homework', 'Tarefa'],
  ['next_recommendation', 'Próximos passos'],
  ['parent_message', 'Mensagem ao responsável'],
] as const;

function formatDate(value?: string | null) {
  if (!value) return 'Data não definida';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

function subjectOf(report: LessonReport) {
  return report.class_schedules?.subject || report.students?.subject || 'Aula';
}

function statusTone(status: LessonReportStatus) {
  if (status === 'PUBLISHED') return 'success';
  if (status === 'APPROVED') return 'info';
  if (status === 'ARCHIVED') return 'neutral';
  return 'warning';
}

export function TeacherSmartLessonPanel() {
  const search = useSearchParams();
  const initialLessonId = search.get('lesson_id') || '';
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [reports, setReports] = useState<LessonReport[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [filter, setFilter] = useState<'ALL' | LessonReportStatus>('ALL');
  const [form, setForm] = useState({
    lesson_id: initialLessonId,
    taught_content: '',
    observations: '',
    homework: '',
    raw_transcript: '',
  });
  const [draft, setDraft] = useState<Partial<LessonReport>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const [scheduleData, reportData] = await Promise.all([
        apiFetch<{ classes: ClassSchedule[] }>('/api/teacher/schedule'),
        apiFetch<{ reports: LessonReport[] }>('/api/teacher/smart-lessons'),
      ]);
      setClasses(scheduleData.classes);
      setReports(reportData.reports);
      if (!selectedId && reportData.reports[0]) setSelectedId(reportData.reports[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar Aula Inteligente.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const selected = reports.find((item) => item.id === selectedId) || reports[0] || null;

  useEffect(() => {
    if (selected) setDraft(selected);
  }, [selected?.id]);

  const filtered = filter === 'ALL' ? reports : reports.filter((item) => item.status === filter);
  const counts = useMemo(() => ({
    DRAFT: reports.filter((item) => item.status === 'DRAFT').length,
    APPROVED: reports.filter((item) => item.status === 'APPROVED').length,
    PUBLISHED: reports.filter((item) => item.status === 'PUBLISHED').length,
    ARCHIVED: reports.filter((item) => item.status === 'ARCHIVED').length,
  }), [reports]);

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!form.lesson_id) {
      setError('Selecione uma aula para gerar o relatório.');
      return;
    }
    setSaving('generate');
    setError('');
    try {
      const data = await apiFetch<{ report: LessonReport }>('/api/teacher/smart-lessons', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      await load();
      setSelectedId(data.report.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar relatório.');
    } finally {
      setSaving('');
    }
  }

  async function save(status?: LessonReportStatus) {
    if (!selected) return;
    setSaving(status || 'save');
    setError('');
    try {
      const body = { ...draft, status: status || draft.status || selected.status };
      const data = await apiFetch<{ report: LessonReport }>(`/api/teacher/smart-lessons/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setReports((current) => current.map((item) => item.id === data.report.id ? data.report : item));
      setSelectedId(data.report.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar relatório.');
    } finally {
      setSaving('');
    }
  }

  async function remove() {
    if (!selected) return;
    setSaving('delete');
    setError('');
    try {
      await apiFetch(`/api/teacher/smart-lessons/${selected.id}`, { method: 'DELETE' });
      setReports((current) => current.filter((item) => item.id !== selected.id));
      setSelectedId('');
      setDraft({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir relatório.');
    } finally {
      setSaving('');
    }
  }

  return (
    <div className="smart-lesson-page">
      <section className="smart-main">
        <div className="smart-header">
          <div>
            <span className="eyebrow">Aula Inteligente</span>
            <h1>Relatórios pedagógicos com revisão do professor</h1>
            <p>A IA gera apenas um rascunho. Você revisa, aprova e publica manualmente.</p>
          </div>
        </div>
        <StatusMessage error={error} loading={loading} />

        <div className="smart-metrics">
          <article><span>Rascunhos</span><strong>{counts.DRAFT}</strong></article>
          <article><span>Aprovados</span><strong>{counts.APPROVED}</strong></article>
          <article><span>Publicados</span><strong>{counts.PUBLISHED}</strong></article>
          <article><span>Arquivados</span><strong>{counts.ARCHIVED}</strong></article>
        </div>

        <form className="smart-generate-card" onSubmit={generate}>
          <h2>Gerar relatório da aula</h2>
          <select value={form.lesson_id} onChange={(event) => setForm({ ...form, lesson_id: event.target.value })} required>
            <option value="">Selecione uma aula</option>
            {classes.map((item) => (
              <option value={item.id} key={item.id}>
                {formatDate(item.class_date)} - {item.class_time.slice(0, 5)} - {item.students?.full_name || 'Aluno'} - {item.subject || 'Aula'}
              </option>
            ))}
          </select>
          <input value={form.taught_content} onChange={(event) => setForm({ ...form, taught_content: event.target.value })} placeholder="Conteúdo trabalhado" />
          <input value={form.observations} onChange={(event) => setForm({ ...form, observations: event.target.value })} placeholder="Observações do professor" />
          <input value={form.homework} onChange={(event) => setForm({ ...form, homework: event.target.value })} placeholder="Tarefa combinada" />
          <textarea value={form.raw_transcript} onChange={(event) => setForm({ ...form, raw_transcript: event.target.value })} placeholder="Cole aqui a transcrição da aula ou escreva um resumo livre." />
          <button className="side-primary" disabled={saving === 'generate'}>{saving === 'generate' ? 'Gerando...' : 'Gerar relatório com IA'}</button>
        </form>

        <div className="smart-filter-row">
          {(['ALL', 'DRAFT', 'APPROVED', 'PUBLISHED', 'ARCHIVED'] as const).map((item) => (
            <button className={filter === item ? 'active' : ''} type="button" onClick={() => setFilter(item)} key={item}>
              {item === 'ALL' ? 'Todos' : statusLabels[item]}
            </button>
          ))}
        </div>

        <div className="smart-report-list">
          {filtered.length === 0 && <p className="muted">Nenhum relatório encontrado.</p>}
          {filtered.map((report) => (
            <button className={report.id === selected?.id ? 'active' : ''} type="button" key={report.id} onClick={() => setSelectedId(report.id)}>
              <span>
                <strong>{report.students?.full_name || 'Aluno'}</strong>
                <small>{subjectOf(report)} - {formatDate(report.class_schedules?.class_date)}</small>
              </span>
              <em className={`smart-status ${statusTone(report.status)}`}>{statusLabels[report.status]}</em>
            </button>
          ))}
        </div>
      </section>

      <aside className="smart-editor">
        {!selected ? (
          <div className="empty-smart-editor">
            <h2>Selecione ou gere um relatório</h2>
            <p>Depois da geração, o conteúdo fica privado até você publicar.</p>
          </div>
        ) : (
          <>
            <div className="smart-editor-head">
              <span className={`smart-status ${statusTone(selected.status)}`}>{statusLabels[selected.status]}</span>
              <h2>Revisão do relatório</h2>
              <p>{selected.students?.full_name || 'Aluno'} - {subjectOf(selected)}</p>
            </div>
            <div className="smart-editor-fields">
              {fields.map(([name, label]) => (
                <label key={name}>
                  <span>{label}</span>
                  {name === 'title' ? (
                    <input value={(draft[name] as string) || ''} onChange={(event) => setDraft({ ...draft, [name]: event.target.value })} />
                  ) : (
                    <textarea value={(draft[name] as string) || ''} onChange={(event) => setDraft({ ...draft, [name]: event.target.value })} />
                  )}
                </label>
              ))}
            </div>
            <div className="smart-actions">
              <button type="button" className="outline-action" onClick={() => save('DRAFT')} disabled={!!saving}>Salvar rascunho</button>
              <button type="button" className="outline-action" onClick={() => save('APPROVED')} disabled={!!saving}>Aprovar</button>
              <button type="button" className="side-primary" onClick={() => save('PUBLISHED')} disabled={!!saving}>Publicar relatório</button>
              <button type="button" className="outline-action" onClick={() => save('ARCHIVED')} disabled={!!saving}>Arquivar</button>
              <button type="button" className="outline-action danger-outline" onClick={remove} disabled={!!saving}>Excluir</button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export function StudentLessonHistoryPanel() {
  const [reports, setReports] = useState<LessonReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ reports: LessonReport[] }>('/api/student/lesson-reports')
      .then((data) => setReports(data.reports))
      .catch((err) => setError(err instanceof Error ? err.message : 'Falha ao carregar histórico.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="student-history-page">
      <div className="student-greeting">
        <h1>Histórico de Aulas</h1>
        <p>Relatórios publicados pelo professor aparecem aqui.</p>
      </div>
      <StatusMessage error={error} loading={loading} />
      <div className="student-report-grid">
        {reports.length === 0 && <div className="empty-smart-editor"><h2>Nenhum relatório publicado</h2><p>Quando o professor publicar uma aula, ela aparecerá nesta área.</p></div>}
        {reports.map((report) => (
          <article className="student-report-card" key={report.id}>
            <div>
              <span>{formatDate(report.class_schedules?.class_date)}</span>
              <h2>{report.title}</h2>
              <p>{report.summary}</p>
            </div>
            <dl>
              <dt>Conteúdo ensinado</dt><dd>{report.taught_content || 'Não informado.'}</dd>
              <dt>Pontos para reforçar</dt><dd>{report.reinforcement_points || 'Não informado.'}</dd>
              <dt>Tarefa</dt><dd>{report.homework || 'Não informada.'}</dd>
              <dt>Próximos passos</dt><dd>{report.next_recommendation || 'Não informado.'}</dd>
            </dl>
            <small>Os relatórios gerados pela IA são sugestões produzidas com base nas informações fornecidas pelo professor. O professor é o responsável pela revisão, aprovação e publicação do conteúdo.</small>
          </article>
        ))}
      </div>
    </div>
  );
}
