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
  ['title', 'Titulo'],
  ['summary', 'Resumo'],
  ['taught_content', 'Conteudo trabalhado'],
  ['student_questions', 'Duvidas identificadas'],
  ['reinforcement_points', 'Pontos para reforcar'],
  ['exercises_done', 'Exercicios realizados'],
  ['homework', 'Tarefa combinada'],
  ['learning_progress', 'Evolucao percebida'],
  ['learning_evidence', 'Analise sincera da evolucao'],
  ['detected_doubts', 'Duvidas detectadas pela IA'],
  ['next_lesson_suggestion', 'Proxima aula sugerida'],
  ['next_recommendation', 'Recomendacao pedagogica'],
  ['guardian_message', 'Mensagem para responsavel'],
] as const;

const demoReports = [
  {
    student: 'Ana Beatriz',
    subject: 'Matematica',
    title: 'Relatorio de Matematica - Ana Beatriz',
    summary: 'Trabalhou funcoes do 1o grau e mostrou boa evolucao na leitura dos graficos.',
  },
  {
    student: 'Lucas Almeida',
    subject: 'Fisica',
    title: 'Relatorio de Fisica - Lucas Almeida',
    summary: 'Revisou movimento uniforme e precisa reforcar interpretacao de enunciados.',
  },
];

function formatDate(value?: string | null) {
  if (!value) return 'Data nao definida';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Ainda nao publicado';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
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

function reportText(report: Partial<LessonReport>) {
  return [
    report.title,
    report.summary,
    report.taught_content && `Conteudo: ${report.taught_content}`,
    report.reinforcement_points && `Reforco: ${report.reinforcement_points}`,
    report.homework && `Tarefa: ${report.homework}`,
    report.learning_progress && `Evolucao percebida: ${report.learning_progress}`,
    report.next_lesson_suggestion && `Proxima aula sugerida: ${report.next_lesson_suggestion}`,
  ].filter(Boolean).join('\n\n');
}

function hasRecurringDifficulty(report: LessonReport) {
  const text = `${report.learning_progress || ''} ${report.reinforcement_points || ''}`.toLowerCase();
  return text.includes('dificuldade recorrente') || text.includes('recorrente detectada');
}

function scoreOf(report: LessonReport, index: number) {
  if (typeof report.learning_score === 'number') return Math.max(0, Math.min(100, report.learning_score));
  const text = `${report.learning_progress || ''} ${report.reinforcement_points || ''}`.toLowerCase();
  if (text.includes('dificuldade recorrente')) return Math.max(25, 58 - index * 4);
  if (text.includes('duvida') || text.includes('dificuldade')) return 58;
  return Math.min(84, 66 + index * 4);
}

function StudentEvolutionChart({ reports }: { reports: LessonReport[] }) {
  const chronological = [...reports]
    .sort((a, b) => new Date(a.published_at || a.updated_at).getTime() - new Date(b.published_at || b.updated_at).getTime())
    .slice(-8);
  const points = chronological.map((report, index) => ({
    report,
    score: scoreOf(report, index),
    x: chronological.length === 1 ? 50 : (index / (chronological.length - 1)) * 100,
    y: 100 - scoreOf(report, index),
  }));
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
  const last = points[points.length - 1];
  const previous = points[points.length - 2];
  const delta = last && previous ? last.score - previous.score : 0;

  return (
    <section className="student-evolution-card">
      <div className="student-evolution-head">
        <div>
          <span className="eyebrow">Evolucao por IA</span>
          <h2>{last ? `${last.score}%` : '--'}</h2>
        </div>
        <em className={delta >= 0 ? 'up' : 'down'}>{points.length < 2 ? 'primeira leitura' : `${delta >= 0 ? '+' : ''}${delta} pontos`}</em>
      </div>
      {points.length > 0 ? (
        <>
          <div className="student-evolution-chart" aria-label="Grafico de evolucao do aluno">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img">
              <defs>
                <linearGradient id="evolutionLine" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#0b64e9" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
              <path className="grid-line" d="M0 25 H100 M0 50 H100 M0 75 H100" />
              <path className="area-line" d={`${path} L 100 100 L 0 100 Z`} />
              <path className="score-line" d={path} />
              {points.map((point) => <circle key={point.report.id} cx={point.x} cy={point.y} r="2.4" />)}
            </svg>
          </div>
          <div className="student-evolution-insight">
            <strong>{last?.report.class_schedules?.subject || subjectOf(last!.report)}</strong>
            <p>{last?.report.learning_evidence || last?.report.learning_progress || 'A IA ainda precisa de mais relatórios publicados para medir tendência com segurança.'}</p>
          </div>
        </>
      ) : (
        <p className="muted">Quando houver relatórios publicados, a evolução aparecerá aqui.</p>
      )}
    </section>
  );
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
    class_notes: '',
    homework: '',
  });
  const [draft, setDraft] = useState<Partial<LessonReport>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [copied, setCopied] = useState(false);
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
  const counts = useMemo(() => {
    const published = reports.filter((item) => item.status === 'PUBLISHED');
    const recurringStudents = new Set(published.filter(hasRecurringDifficulty).map((item) => item.student_id));

    return {
      generated: reports.length,
      review: reports.filter((item) => item.status === 'DRAFT' || item.status === 'APPROVED').length,
      published: published.length,
      recurring: recurringStudents.size,
    };
  }, [reports]);

  const progress = useMemo(() => {
    if (!selected) return null;
    const studentReports = reports
      .filter((item) => item.student_id === selected.student_id && item.status === 'PUBLISHED')
      .sort((a, b) => new Date(b.published_at || b.updated_at).getTime() - new Date(a.published_at || a.updated_at).getTime());

    return {
      total: studentReports.length,
      last: studentReports[0]?.published_at || studentReports[0]?.updated_at,
      score: selected.learning_score || studentReports[0]?.learning_score,
      evolution: selected.learning_progress || studentReports[0]?.learning_progress || 'Ainda sem evolucao publicada.',
      reinforcement: selected.reinforcement_points || studentReports[0]?.reinforcement_points || 'Ainda sem ponto recorrente.',
    };
  }, [reports, selected]);

  const alerts = useMemo(() => {
    const drafts = reports.filter((item) => item.status === 'DRAFT').length;
    const recurring = reports.filter((item) => item.status === 'PUBLISHED' && hasRecurringDifficulty(item)).slice(0, 3);
    const result = [];
    if (drafts) result.push(`${drafts} relatorio(s) aguardando revisao antes de aparecer para o aluno.`);
    recurring.forEach((item) => result.push(`${item.students?.full_name || 'Aluno'} tem ponto de reforco recorrente em ${subjectOf(item)}.`));
    if (!result.length) result.push('Nenhum alerta pedagogico critico no momento.');
    return result;
  }, [reports]);

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!form.lesson_id) {
      setError('Selecione uma aula para gerar o relatorio.');
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
      setForm({ lesson_id: form.lesson_id, taught_content: '', class_notes: '', homework: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar relatorio.');
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
      setError(err instanceof Error ? err.message : 'Falha ao salvar relatorio.');
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
      setError(err instanceof Error ? err.message : 'Falha ao excluir relatorio.');
    } finally {
      setSaving('');
    }
  }

  async function openGuardianWhatsapp() {
    const message = draft.guardian_message || draft.parent_message || selected?.guardian_message || selected?.parent_message || '';
    const phone = (selected?.students?.guardian_whatsapp || '').replace(/\D/g, '');
    if (!message) return;
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
    if (phone) {
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <div className="smart-lesson-page">
      <section className="smart-main">
        <div className="smart-header">
          <div>
            <span className="eyebrow">Aula Inteligente</span>
            <h1>Relatorios pedagogicos com revisao do professor</h1>
            <p>A IA organiza poucas linhas em um relatorio claro. Voce revisa, aprova e publica manualmente.</p>
          </div>
        </div>
        <StatusMessage error={error} loading={loading} />

        <div className="smart-metrics">
          <article><span>Relatorios gerados</span><strong>{counts.generated}</strong></article>
          <article><span>Aguardando revisao</span><strong>{counts.review}</strong></article>
          <article><span>Publicados</span><strong>{counts.published}</strong></article>
          <article><span>Alunos com dificuldade recorrente</span><strong>{counts.recurring}</strong></article>
        </div>

        <section className="smart-alerts">
          <h2>Alertas pedagogicos</h2>
          {alerts.map((alert) => <p key={alert}>{alert}</p>)}
        </section>

        <form className="smart-generate-card" onSubmit={generate}>
          <div>
            <h2>Gerar relatorio da aula</h2>
            <p>Escreva poucas linhas. A IA organiza o relatorio para voce.</p>
          </div>
          <select value={form.lesson_id} onChange={(event) => setForm({ ...form, lesson_id: event.target.value })} required>
            <option value="">Selecionar aula</option>
            {classes.map((item) => (
              <option value={item.id} key={item.id}>
                {formatDate(item.class_date)} - {item.class_time.slice(0, 5)} - {item.students?.full_name || 'Aluno'} - {item.subject || 'Aula'}
              </option>
            ))}
          </select>
          <input value={form.taught_content} onChange={(event) => setForm({ ...form, taught_content: event.target.value })} placeholder="Conteudo trabalhado" />
          <textarea
            value={form.class_notes}
            onChange={(event) => setForm({ ...form, class_notes: event.target.value })}
            placeholder="Ex: Trabalhamos ligacao ionica. O aluno entendeu a parte principal, mas teve duvida em identificar cation e anion. Fizemos exercicios 1 a 4 e ficou tarefa 5 a 8."
          />
          <input value={form.homework} onChange={(event) => setForm({ ...form, homework: event.target.value })} placeholder="Tarefa combinada" />
          <button className="side-primary" disabled={saving === 'generate'}>{saving === 'generate' ? 'Gerando...' : 'Gerar relatorio em 10 segundos'}</button>
        </form>

        <div className="smart-filter-row">
          {(['ALL', 'DRAFT', 'APPROVED', 'PUBLISHED', 'ARCHIVED'] as const).map((item) => (
            <button className={filter === item ? 'active' : ''} type="button" onClick={() => setFilter(item)} key={item}>
              {item === 'ALL' ? 'Todos' : statusLabels[item]}
            </button>
          ))}
        </div>

        <div className="smart-report-list">
          {filtered.length === 0 && (
            <div className="smart-demo-box">
              <strong>Exemplos do modulo</strong>
              {demoReports.map((report) => (
                <article key={report.student}>
                  <span>{report.student} - {report.subject}</span>
                  <h3>{report.title}</h3>
                  <p>{report.summary}</p>
                </article>
              ))}
            </div>
          )}
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
            <h2>Selecione ou gere um relatorio</h2>
            <p>Depois da geracao, o conteudo fica privado ate voce publicar.</p>
          </div>
        ) : (
          <>
            <div className="smart-editor-head">
              <span className={`smart-status ${statusTone(selected.status)}`}>{statusLabels[selected.status]}</span>
              <h2>Revisao do relatorio</h2>
              <p>{selected.students?.full_name || 'Aluno'} - {subjectOf(selected)}</p>
            </div>
            {progress && (
              <section className="smart-progress-card">
                <h3>Progresso do aluno</h3>
                <dl>
                  <dt>Total publicado</dt><dd>{progress.total}</dd>
                  <dt>Ultima aula publicada</dt><dd>{formatDateTime(progress.last)}</dd>
                  <dt>Evolucao medida</dt><dd>{progress.score ? `${progress.score}/100` : 'Aguardando mais dados'}</dd>
                  <dt>Principal evolucao</dt><dd>{progress.evolution}</dd>
                  <dt>Ponto para reforcar</dt><dd>{progress.reinforcement}</dd>
                </dl>
              </section>
            )}
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
              <label>
                <span>Assinatura do professor</span>
                <input value={(draft.teacher_signature as string) || ''} onChange={(event) => setDraft({ ...draft, teacher_signature: event.target.value })} />
              </label>
            </div>
            <div className="smart-copy-row">
              <button type="button" className="outline-action" onClick={openGuardianWhatsapp}>
                {selected.students?.guardian_whatsapp ? 'Enviar mensagem no WhatsApp' : 'Copiar mensagem para WhatsApp'}
              </button>
              {copied && <span>{selected.students?.guardian_whatsapp ? 'WhatsApp aberto com a mensagem pronta.' : 'Mensagem copiada. Cadastre o WhatsApp do responsável para abrir direto.'}</span>}
            </div>
            <div className="smart-actions">
              <button type="button" className="outline-action" onClick={() => save('DRAFT')} disabled={!!saving}>Salvar rascunho</button>
              <button type="button" className="outline-action" onClick={() => save('APPROVED')} disabled={!!saving}>Aprovar</button>
              <button type="button" className="side-primary" onClick={() => save('PUBLISHED')} disabled={!!saving}>Publicar relatorio</button>
              <button type="button" className="outline-action" onClick={() => save('ARCHIVED')} disabled={!!saving}>Arquivar</button>
              <button type="button" className="outline-action danger-outline" onClick={remove} disabled={!!saving}>Excluir</button>
            </div>
            <pre className="smart-report-preview">{reportText(draft)}</pre>
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
      .catch((err) => setError(err instanceof Error ? err.message : 'Falha ao carregar historico.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="student-history-page">
      <div className="student-greeting">
        <h1>Historico de Aulas</h1>
        <p>Veja em timeline apenas os relatorios publicados pelo professor.</p>
      </div>
      <StatusMessage error={error} loading={loading} />
      <StudentEvolutionChart reports={reports} />
      <div className="student-timeline">
        {reports.length === 0 && (
          <div className="empty-smart-editor">
            <h2>Nenhum relatorio publicado</h2>
            <p>Quando o professor publicar uma aula, ela aparecera nesta area.</p>
          </div>
        )}
        {reports.map((report) => (
          <article className="student-timeline-card" key={report.id}>
            <div className="timeline-dot" />
            <div className="student-report-card">
              <div>
                <span>{formatDate(report.class_schedules?.class_date)}</span>
                <h2>{report.title}</h2>
                <p>{report.summary}</p>
              </div>
              <dl>
                <dt>Conteudo trabalhado</dt><dd>{report.taught_content || 'Nao informado.'}</dd>
                <dt>Evolucao percebida</dt><dd>{report.learning_progress || 'Nao informada.'}</dd>
                <dt>Pontos para reforcar</dt><dd>{report.reinforcement_points || 'Nao informado.'}</dd>
                <dt>Proxima aula sugerida</dt><dd>{report.next_lesson_suggestion || report.next_recommendation || 'Nao informado.'}</dd>
                <dt>Tarefa</dt><dd>{report.homework || 'Nao informada.'}</dd>
              </dl>
              <small>{report.teacher_signature || 'Relatorio revisado pelo professor.'} Publicado em {formatDateTime(report.published_at)}.</small>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
