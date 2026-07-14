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
  ['taught_content', 'Conteúdo trabalhado'],
  ['student_questions', 'Dúvidas identificadas'],
  ['reinforcement_points', 'Pontos para reforçar'],
  ['exercises_done', 'Exercícios realizados'],
  ['homework', 'Tarefa combinada'],
  ['learning_progress', 'Evolução percebida'],
  ['learning_evidence', 'Análise sincera da evolução'],
  ['detected_doubts', 'Dúvidas detectadas pela IA'],
  ['next_lesson_suggestion', 'Próxima aula sugerida'],
  ['next_recommendation', 'Recomendacao pedagogica'],
  ['guardian_message', 'Mensagem para responsável'],
] as const;

const demoReports = [
  {
    student: 'Ana Beatriz',
    subject: 'Matemática',
    title: 'Relatório de Matemática - Ana Beatriz',
    summary: 'Trabalhou funções do 1º grau e mostrou boa evolução na leitura dos gráficos.',
  },
  {
    student: 'Lucas Almeida',
    subject: 'Física',
    title: 'Relatório de Física - Lucas Almeida',
    summary: 'Revisou movimento uniforme e precisa reforçar interpretação de enunciados.',
  },
];

type MonthlyStudentReport = {
  student: string;
  subject: string;
  period: string;
  total_reports: number;
  average_score: number | null;
  trend: string;
  executive_summary: string;
  content_worked: string[];
  recurring_difficulties: string[];
  progress_analysis: string;
  recommended_plan: string;
  guardian_message: string;
  full_text: string;
};

function formatDate(value?: string | null) {
  if (!value) return 'Data não definida';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Ainda não publicado';
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
    report.taught_content && `Conteúdo: ${report.taught_content}`,
    report.reinforcement_points && `Reforço: ${report.reinforcement_points}`,
    report.homework && `Tarefa: ${report.homework}`,
    report.learning_progress && `Evolução percebida: ${report.learning_progress}`,
    report.next_lesson_suggestion && `Próxima aula sugerida: ${report.next_lesson_suggestion}`,
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
  if (text.includes('dúvida') || text.includes('dificuldade')) return 58;
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
          <span className="eyebrow">Evolução por IA</span>
          <h2>{last ? `${last.score}%` : '--'}</h2>
        </div>
        <em className={delta >= 0 ? 'up' : 'down'}>{points.length < 2 ? 'primeira leitura' : `${delta >= 0 ? '+' : ''}${delta} pontos`}</em>
      </div>
      {points.length > 0 ? (
        <>
          <div className="student-evolution-chart" aria-label="Gráfico de evolução do aluno">
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
    teacher_guidance: '',
  });
  const [monthlyForm, setMonthlyForm] = useState({
    student_id: '',
    month_reference: new Date().toISOString().slice(0, 7),
    teacher_guidance: '',
  });
  const [monthlyReport, setMonthlyReport] = useState<MonthlyStudentReport | null>(null);
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

  const monthlyStudents = useMemo(() => {
    const map = new Map<string, string>();
    reports.forEach((report) => {
      if (report.student_id && report.students?.full_name) map.set(report.student_id, report.students.full_name);
    });
    classes.forEach((item) => {
      if (item.student_id && item.students?.full_name) map.set(item.student_id, item.students.full_name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [classes, reports]);

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
      evolution: selected.learning_progress || studentReports[0]?.learning_progress || 'Ainda sem evolução publicada.',
      reinforcement: selected.reinforcement_points || studentReports[0]?.reinforcement_points || 'Ainda sem ponto recorrente.',
    };
  }, [reports, selected]);

  const alerts = useMemo(() => {
    const drafts = reports.filter((item) => item.status === 'DRAFT').length;
    const recurring = reports.filter((item) => item.status === 'PUBLISHED' && hasRecurringDifficulty(item)).slice(0, 3);
    const result = [];
    if (drafts) result.push(`${drafts} relatório(s) aguardando revisão antes de aparecer para o aluno.`);
    recurring.forEach((item) => result.push(`${item.students?.full_name || 'Aluno'} tem ponto de reforco recorrente em ${subjectOf(item)}.`));
    if (!result.length) result.push('Nenhum alerta pedagógico crítico no momento.');
    return result;
  }, [reports]);

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
      setForm({ lesson_id: form.lesson_id, taught_content: '', class_notes: '', homework: '', teacher_guidance: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar relatório.');
    } finally {
      setSaving('');
    }
  }

  async function generateMonthly(event: FormEvent) {
    event.preventDefault();
    if (!monthlyForm.student_id) {
      setError('Selecione um aluno para gerar o relatorio mensal.');
      return;
    }
    setSaving('monthly');
    setError('');
    setMonthlyReport(null);
    try {
      const data = await apiFetch<{ monthlyReport: MonthlyStudentReport }>('/api/teacher/smart-lessons/monthly', {
        method: 'POST',
        body: JSON.stringify(monthlyForm),
      });
      setMonthlyReport(data.monthlyReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar relatorio mensal.');
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
            <h1>Relatórios pedagógicos com revisão do professor</h1>
            <p>A IA organiza poucas linhas em um relatório claro. Você revisa, aprova e publica manualmente.</p>
          </div>
        </div>
        <StatusMessage error={error} loading={loading} />

        <div className="smart-metrics">
          <article><span>Relatórios gerados</span><strong>{counts.generated}</strong></article>
          <article><span>Aguardando revisão</span><strong>{counts.review}</strong></article>
          <article><span>Publicados</span><strong>{counts.published}</strong></article>
          <article><span>Alunos com dificuldade recorrente</span><strong>{counts.recurring}</strong></article>
        </div>

        <section className="smart-alerts">
          <h2>Alertas pedagógicos</h2>
          {alerts.map((alert) => <p key={alert}>{alert}</p>)}
        </section>

        <form className="smart-generate-card" onSubmit={generate}>
          <div>
            <h2>Gerar relatório da aula</h2>
            <p>Escreva poucas linhas. A IA organiza o relatório para você.</p>
          </div>
          <select value={form.lesson_id} onChange={(event) => setForm({ ...form, lesson_id: event.target.value })} required>
            <option value="">Selecionar aula</option>
            {classes.map((item) => (
              <option value={item.id} key={item.id}>
                {formatDate(item.class_date)} - {item.class_time.slice(0, 5)} - {item.students?.full_name || 'Aluno'} - {item.subject || 'Aula'}
              </option>
            ))}
          </select>
          <input value={form.taught_content} onChange={(event) => setForm({ ...form, taught_content: event.target.value })} placeholder="Conteúdo trabalhado" />
          <textarea
            value={form.class_notes}
            onChange={(event) => setForm({ ...form, class_notes: event.target.value })}
            placeholder="Ex: Trabalhamos ligação iônica. O aluno entendeu a parte principal, mas teve dúvida em identificar cátion e ânion. Fizemos exercicios 1 a 4 e ficou tarefa 5 a 8."
          />
          <input value={form.homework} onChange={(event) => setForm({ ...form, homework: event.target.value })} placeholder="Tarefa combinada" />
          <textarea
            value={form.teacher_guidance}
            onChange={(event) => setForm({ ...form, teacher_guidance: event.target.value })}
            placeholder="Orientação do professor para a IA. Ex: deixe o texto mais acolhedor para os pais, destaque interpretação de texto e sugira reforço para a próxima aula."
          />
          <button className="side-primary" disabled={saving === 'generate'}>{saving === 'generate' ? 'Gerando...' : 'Gerar relatório em 10 segundos'}</button>
        </form>

        <form className="smart-generate-card smart-monthly-card" onSubmit={generateMonthly}>
          <div>
            <h2>Relatório mensal completo do aluno</h2>
            <p>Use todos os relatórios publicados do mês para gerar uma análise detalhada, sincera e pronta para enviar ao responsável.</p>
          </div>
          <select value={monthlyForm.student_id} onChange={(event) => setMonthlyForm({ ...monthlyForm, student_id: event.target.value })} required>
            <option value="">Selecionar aluno</option>
            {monthlyStudents.map((student) => (
              <option value={student.id} key={student.id}>{student.name}</option>
            ))}
          </select>
          <input
            type="month"
            value={monthlyForm.month_reference}
            onChange={(event) => setMonthlyForm({ ...monthlyForm, month_reference: event.target.value })}
          />
          <textarea
            value={monthlyForm.teacher_guidance}
            onChange={(event) => setMonthlyForm({ ...monthlyForm, teacher_guidance: event.target.value })}
            placeholder="Orientação opcional. Ex: foque na evolução para os pais, detalhe dificuldades recorrentes e proponha um plano para o próximo mês."
          />
          <button className="side-primary" disabled={saving === 'monthly'}>{saving === 'monthly' ? 'Gerando...' : 'Gerar relatório mensal completo'}</button>
          {monthlyReport && (
            <div className="monthly-report-preview">
              <div className="monthly-report-head">
                <span className="eyebrow">Relatório mensal</span>
                <strong>{monthlyReport.student} - {monthlyReport.period}</strong>
              </div>
              <div className="monthly-report-grid">
                <span><b>{monthlyReport.total_reports}</b> relatórios analisados</span>
                <span><b>{monthlyReport.average_score ?? '--'}</b> média IA</span>
                <span><b>{monthlyReport.subject}</b> matéria</span>
              </div>
              <p>{monthlyReport.executive_summary}</p>
              <h3>Conteúdos trabalhados</h3>
              <ul>{monthlyReport.content_worked.slice(0, 6).map((item) => <li key={item}>{item}</li>)}</ul>
              <h3>Pontos de atenção</h3>
              <ul>{monthlyReport.recurring_difficulties.length ? monthlyReport.recurring_difficulties.slice(0, 6).map((item) => <li key={item}>{item}</li>) : <li>Nenhum ponto recorrente forte foi identificado.</li>}</ul>
              <h3>Plano recomendado</h3>
              <p>{monthlyReport.recommended_plan}</p>
              <h3>Mensagem para responsável</h3>
              <p>{monthlyReport.guardian_message}</p>
            </div>
          )}
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
              <strong>Exemplos do módulo</strong>
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
            <h2>Selecione ou gere um relatório</h2>
            <p>Depois da geração, o conteúdo fica privado ate você publicar.</p>
          </div>
        ) : (
          <>
            <div className="smart-editor-head">
              <span className={`smart-status ${statusTone(selected.status)}`}>{statusLabels[selected.status]}</span>
              <h2>Revisão do relatório</h2>
              <p>{selected.students?.full_name || 'Aluno'} - {subjectOf(selected)}</p>
            </div>
            {progress && (
              <section className="smart-progress-card">
                <h3>Progresso do aluno</h3>
                <dl>
                  <dt>Total publicado</dt><dd>{progress.total}</dd>
                  <dt>Última aula publicada</dt><dd>{formatDateTime(progress.last)}</dd>
                  <dt>Evolução medida</dt><dd>{progress.score ? `${progress.score}/100` : 'Aguardando mais dados'}</dd>
                  <dt>Principal evolução</dt><dd>{progress.evolution}</dd>
                  <dt>Ponto para reforçar</dt><dd>{progress.reinforcement}</dd>
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
              <button type="button" className="side-primary" onClick={() => save('PUBLISHED')} disabled={!!saving}>Publicar relatório</button>
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
      .catch((err) => setError(err instanceof Error ? err.message : 'Falha ao carregar histórico.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="student-history-page">
      <div className="student-greeting">
        <h1>Histórico de Aulas</h1>
        <p>Veja em timeline apenas os relatórios publicados pelo professor.</p>
      </div>
      <StatusMessage error={error} loading={loading} />
      <div className="student-timeline">
        {reports.length === 0 && (
          <div className="empty-smart-editor">
            <h2>Nenhum relatório publicado</h2>
            <p>Quando o professor publicar uma aula, ela aparecerá nesta área.</p>
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
                <dt>Conteúdo trabalhado</dt><dd>{report.taught_content || 'Não informado.'}</dd>
                <dt>Evolução percebida</dt><dd>{report.learning_progress || 'Não informada.'}</dd>
                <dt>Pontos para reforçar</dt><dd>{report.reinforcement_points || 'Não informado.'}</dd>
                <dt>Próxima aula sugerida</dt><dd>{report.next_lesson_suggestion || report.next_recommendation || 'Não informado.'}</dd>
                <dt>Tarefa</dt><dd>{report.homework || 'Não informada.'}</dd>
              </dl>
              <small>{report.teacher_signature || 'Relatório revisado pelo professor.'} Publicado em {formatDateTime(report.published_at)}.</small>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
