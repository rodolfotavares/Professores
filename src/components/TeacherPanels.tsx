'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/fetcher';
import { EmptyState, StatusMessage } from '@/components/PanelState';
import { MessageThread } from '@/components/MessageThread';
import { downloadScheduleIcs, requestReminderPermission } from '@/lib/calendar-export';
import type { Activity, ActivitySubmission, ClassSchedule, Message, Student } from '@/types';
import { formatBrazilWhatsapp, isValidBrazilPhone, normalizeBrazilPhone } from '@/lib/validation';

const weekDays = [
  { label: 'Dom', value: '0' },
  { label: 'Seg', value: '1' },
  { label: 'Ter', value: '2' },
  { label: 'Qua', value: '3' },
  { label: 'Qui', value: '4' },
  { label: 'Sex', value: '5' },
  { label: 'Sab', value: '6' },
];

function usePanelLoad(load: () => Promise<void>, interval = 15000) {
  useEffect(() => {
    load();
    const timer = window.setInterval(load, interval);
    return () => window.clearInterval(timer);
  }, []);
}

async function uploadFile(file: File) {
  const body = new FormData();
  body.append('file', file);
  return apiFetch<{ url: string }>('/api/upload', { method: 'POST', body });
}

function statusLabel(status?: string) {
  const labels: Record<string, string> = {
    active: 'Ativo',
    paused: 'Pausado',
    inactive: 'Inativo',
    scheduled: 'Agendada',
    completed: 'Realizada',
    cancelled: 'Cancelada',
    absence: 'Falta',
    pending: 'Pendente',
    submitted: 'Enviada',
    corrected: 'Corrigida',
  };
  return status ? labels[status] || status : '';
}

function PanelHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="panel-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      <p>{text}</p>
    </div>
  );
}

export function TeacherDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const [s, c, a, delivered] = await Promise.all([
        apiFetch<{ students: Student[] }>('/api/teacher/students'),
        apiFetch<{ classes: ClassSchedule[] }>('/api/teacher/schedule'),
        apiFetch<{ activities: Activity[] }>('/api/teacher/activities'),
        apiFetch<{ submissions: ActivitySubmission[] }>('/api/teacher/submissions'),
      ]);
      setStudents(s.students);
      setClasses(c.classes);
      setActivities(a.activities);
      setSubmissions(delivered.submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar painel.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  const activeStudents = students.filter((student) => student.status !== 'inactive').length;
  const pendingClasses = classes.filter((item) => item.status === 'scheduled').length;
  const completedClasses = classes.filter((item) => item.status === 'completed').length;
  const pendingActivities = activities.filter((activity) => !submissions.some((submission) => submission.activity_id === activity.id)).length;
  const corrected = submissions.filter((submission) => submission.status === 'corrected').length;
  const hasStudents = students.length > 0;
  const hasAnyData = students.length > 0 || classes.length > 0 || activities.length > 0 || submissions.length > 0;
  const averagePerformance = submissions.length ? Math.round((corrected / submissions.length) * 100) : null;
  const attendance = classes.length ? Math.round((classes.filter((item) => item.status !== 'absence' && item.status !== 'cancelled').length / classes.length) * 100) : null;
  const delivery = activities.length ? Math.round((submissions.length / activities.length) * 100) : null;
  const week = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
  const today = new Date();
  const weekDaysPreview = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return { label: week[date.getDay()], day: date.getDate(), active: index === 2 };
  });
  const weeklyBars = week.map((label, index) => {
    const total = classes.filter((item) => new Date(`${item.class_date}T00:00:00`).getDay() === index).length;
    const maxDayTotal = Math.max(...week.map((_, day) => classes.filter((item) => new Date(`${item.class_date}T00:00:00`).getDay() === day).length), 1);
    return { label, total, value: total ? Math.max(12, Math.round((total / maxDayTotal) * 92)) : 0 };
  });
  const performanceText = averagePerformance == null ? '-' : `${averagePerformance}%`;
  const performanceValue = averagePerformance == null ? '-' : averagePerformance;
  const attendanceText = attendance == null ? '-' : `${attendance}%`;
  const deliveryText = delivery == null ? '-' : `${delivery}%`;
  const submittedToGrade = submissions.filter((submission) => submission.status === 'submitted').length;

  return (
    <div className="teacher-glass-dashboard">
      <div className="dashboard-topline">
        <div>
          <h1>Resumo do Professor</h1>
          <p>Visão premium das aulas, alunos e entregas.</p>
        </div>
        <div className="dashboard-actions">
          <button className="glass-icon-button" title="Notificações" aria-label="Notificações">o</button>
          <div className="teacher-avatar">P</div>
        </div>
      </div>
      <StatusMessage error={error} loading={loading} />
      {!loading && !hasStudents && (
        <div className="empty dashboard-empty-state">
          <h2>Comece cadastrando seu primeiro aluno</h2>
          <p>Depois disso, este painel vai mostrar aulas da semana, atividades, frequência e desempenho com dados reais.</p>
        </div>
      )}
      <div className="teacher-dashboard-grid">
        <section className="glass-panel activity-week-card">
          <div className="glass-card-head">
            <strong>Atividade da Semana</strong>
            <span>Semanal</span>
          </div>
          <div className="week-bars">
            {weeklyBars.map((bar) => (
              <div className="week-bar" key={bar.label}>
                <span style={{ height: `${bar.value}%` }}><em>{bar.total || '-'}</em></span>
                <small>{bar.label}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="quick-metrics">
          <MetricPill label="Total de alunos" value={students.length} />
          <MetricPill label="Alunos ativos" value={activeStudents} />
          <MetricPill label="Aulas futuras" value={pendingClasses} />
        </section>

        <section className="glass-panel overview-card">
          <div className="glass-card-head">
            <strong>Visão Geral</strong>
            <span>Mensal</span>
          </div>
          <div className="overview-body">
            <div className="overview-ring" style={{ background: averagePerformance == null ? 'rgba(255,255,255,0.12)' : `conic-gradient(#e5ce00 0 ${averagePerformance * 2.35}deg, #36c7f4 ${averagePerformance * 2.35}deg ${averagePerformance * 3.25}deg, rgba(255,255,255,0.16) ${averagePerformance * 3.25}deg 360deg)` }}>
              <div><strong>{performanceText}</strong><small>geral</small></div>
            </div>
            <div className="overview-list">
              <span><i className="dot gold-dot" />Média geral <strong>{performanceValue}</strong></span>
              <span><i className="dot blue-dot" />Frequência <strong>{attendanceText}</strong></span>
              <span><i className="dot green-dot" />Entregas <strong>{deliveryText}</strong></span>
            </div>
          </div>
        </section>

        <section className="glass-panel pending-card">
          <div className="glass-card-head">
            <strong>Pendências</strong>
            <span>Hoje</span>
          </div>
          {hasAnyData ? (
            <>
              <DashboardTodo text="Corrigir atividades" meta={`${submittedToGrade} entregas`} status={submittedToGrade ? 'Pendente' : 'Em dia'} />
              <DashboardTodo text="Lancar presenca" meta={`${pendingClasses} aulas`} status={pendingClasses ? 'Em andamento' : 'Em dia'} />
              <DashboardTodo text="Atividades corrigidas" meta={`${corrected} registros`} status={corrected ? 'Concluido' : 'Aguardando dados'} />
            </>
          ) : (
            <p className="muted">Sem pendencias enquanto nenhum aluno ou aula foi cadastrado.</p>
          )}
        </section>

        <section className="glass-panel agenda-card">
          <div className="glass-card-head">
            <strong>Agenda da Semana</strong>
            <span>{classes.length ? '7 dias' : 'Vazia'}</span>
          </div>
          <div className="week-calendar">
            {weekDaysPreview.map((day) => (
              <div className={day.active ? 'active' : ''} key={`${day.label}-${day.day}`}>
                <small>{day.label}</small>
                <strong>{day.day}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel result-card">
          <div className="glass-card-head">
            <strong>Resultado</strong>
            <span>Mensal</span>
          </div>
          <div className="result-highlight">
            <strong>{performanceText}</strong>
            <span>{averagePerformance == null ? 'sem dados suficientes' : 'desempenho medio'}</span>
            <em>{averagePerformance == null ? 'Cadastre alunos e atividades' : 'Progresso calculado'}</em>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-panel metric-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DashboardTodo({ text, meta, status }: { text: string; meta: string; status: string }) {
  return (
    <div className="dashboard-todo">
      <span className="todo-ring" />
      <div>
        <strong>{text}</strong>
        <small>{meta}</small>
      </div>
      <em>{status}</em>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="metric">
      <p className="muted">{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

export function TeacherFinancePanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [paymentMonth, setPaymentMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [paymentStatus, setPaymentStatus] = useState<Record<string, 'paid' | 'unpaid'>>({});
  const [subscription, setSubscription] = useState<{ month_reference: string; amount: number; status: string; paid_at: string | null } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const subscriptionData = await apiFetch<{ subscription: { month_reference: string; amount: number; status: string; paid_at: string | null } }>(`/api/teacher/subscription?month=${paymentMonth}`);
      setSubscription(subscriptionData.subscription);

      try {
        const studentsData = await apiFetch<{ students: Student[] }>('/api/teacher/students');
        setStudents(studentsData.students);
      } catch (err) {
        setStudents([]);
        if (subscriptionData.subscription.status === 'paid' || subscriptionData.subscription.status === 'exempt') {
          throw err;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar financeiro.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  useEffect(() => {
    load();
  }, [paymentMonth]);

  useEffect(() => {
    const saved = window.localStorage.getItem(`lumina-payments-${paymentMonth}`);
    setPaymentStatus(saved ? JSON.parse(saved) : {});
  }, [paymentMonth]);

  function updatePayment(studentId: string, status: 'paid' | 'unpaid') {
    setPaymentStatus((current) => {
      const next = { ...current, [studentId]: status };
      window.localStorage.setItem(`lumina-payments-${paymentMonth}`, JSON.stringify(next));
      return next;
    });
  }

  const rows = students.map((student) => {
    const weeklyClasses = student.classes_per_week || Math.ceil((student.classes_per_month || 0) / 4);
    const monthly = weeklyClasses * (student.price_per_class || 0) * 4;
    return { ...student, weeklyClasses, monthly, payment: paymentStatus[student.id] || 'unpaid' };
  });
  const total = rows.reduce((sum, student) => sum + student.monthly, 0);
  const active = rows.filter((student) => student.status === 'active').length;
  const paidTotal = rows.filter((student) => student.payment === 'paid').reduce((sum, student) => sum + student.monthly, 0);
  const unpaidTotal = Math.max(0, total - paidTotal);
  const max = Math.max(...rows.map((student) => student.monthly), 1);
  const subscriptionActive = subscription?.status === 'paid' || subscription?.status === 'exempt' || subscription?.status === 'trial';
  const subscriptionLabel = subscription?.status === 'exempt' ? 'Isento' : subscription?.status === 'paid' ? 'Pago' : subscription?.status === 'trial' ? 'Teste grátis' : 'Pendente';
  const subscriptionStatusLabel = subscription?.status === 'exempt' ? 'Liberada' : subscription?.status === 'paid' ? 'Ativa' : subscription?.status === 'trial' ? 'Liberada' : 'Pendente';

  function downloadReceipt(student: typeof rows[number]) {
    const content = [
      'LuminaAI - Recibo de mensalidade',
      `Aluno: ${student.full_name}`,
      `Mes: ${paymentMonth}`,
      `Aulas por semana: ${student.weeklyClasses}`,
      `Valor por aula: ${(student.price_per_class || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      `Total mensal: ${student.monthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      `Status: ${student.payment === 'paid' ? 'Pago' : 'Não pago'}`,
      `Emitido em: ${new Date().toLocaleString('pt-BR')}`,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recibo-${student.full_name.replace(/\s+/g, '-').toLowerCase()}-${paymentMonth}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function whatsappCharge(student: typeof rows[number]) {
    const phone = (student.whatsapp || '').replace(/\D/g, '');
    const message = `Ola, ${student.full_name}! Sua mensalidade LuminaAI de ${paymentMonth} ficou em ${student.monthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`;
    return `https://wa.me/${phone || ''}?text=${encodeURIComponent(message)}`;
  }

  async function createMercadoPagoCheckout() {
    setCheckoutLoading(true);
    setError('');
    try {
      const data = await apiFetch<{ init_point: string; sandbox_init_point?: string }>('/api/payments/mercadopago/preference', {
        method: 'POST',
        body: JSON.stringify({ month_reference: paymentMonth }),
      });
      window.open(data.init_point || data.sandbox_init_point, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar pagamento.');
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="stack">
      <PanelHeader eyebrow="Receita" title="Financeiro" text="Vejá a previsão mensal por aluno." />
      <StatusMessage error={error} loading={loading} />
      <div className="card stack app-subscription-card">
        <div className="glass-card-head">
          <div>
            <span className="eyebrow">Assinatura do app</span>
            <h2>LuminaAI Pro</h2>
          </div>
          <span className={`badge ${subscriptionActive ? 'status-success' : 'status-warning'}`}>
            {subscriptionLabel}
          </span>
        </div>
        <p className="muted">O professor paga apenas pelo uso do LuminaAI. Os alunos não pagam assinatura do app.</p>
        <div className="grid grid-3">
          <div className="metric"><p className="muted">Mensalidade</p><h2>R$ 19,90</h2></div>
          <div className="metric"><p className="muted">Mes</p><h2>{paymentMonth}</h2></div>
          <div className="metric"><p className="muted">Status</p><h2>{subscriptionStatusLabel}</h2></div>
        </div>
        <button className="btn primary" onClick={createMercadoPagoCheckout} disabled={checkoutLoading || subscriptionActive}>
          {checkoutLoading ? 'Gerando...' : subscription?.status === 'exempt' ? 'Professor isento' : subscription?.status === 'paid' ? 'Assinatura paga' : subscription?.status === 'trial' ? 'Teste grátis ativo' : 'Pagar R$ 19,90'}
        </button>
      </div>
      <div className="grid grid-3">
        <div className="metric"><p className="muted">Previsão mensal</p><h2>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2></div>
        <div className="metric"><p className="muted">Alunos ativos</p><h2>{active}</h2></div>
        <div className="metric"><p className="muted">Média por aluno</p><h2>{(active ? total / active : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2></div>
      </div>
      {!loading && rows.length === 0 && <EmptyState title="Sem previsão ainda" text="Cadastre alunos com aulas por semana e valor por aula." />}
      <div className="grid grid-3">
        <label className="metric payment-month-card">
          <p className="muted">Mês de referência</p>
          <input className="input" type="month" value={paymentMonth} onChange={(event) => setPaymentMonth(event.target.value)} />
        </label>
        <div className="metric"><p className="muted">Pagos no mês</p><h2>{paidTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2></div>
        <div className="metric"><p className="muted">Não pagos</p><h2>{unpaidTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2></div>
      </div>
      {rows.length > 0 && (
        <div className="grid grid-2">
          <div className="card finance-chart">
            <div>
              <span className="eyebrow">Ganhos previstos</span>
              <h2>Total mensal</h2>
            </div>
            <div className="finance-ring" style={{ background: `conic-gradient(#084eb8 0 360deg)` }}>
              <div>
                <strong>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                <span>por mês</span>
              </div>
            </div>
          </div>
          <div className="card stack">
            <div>
              <span className="eyebrow">Por aluno</span>
              <h2>Distribuição</h2>
            </div>
            <div className="bar-list">
              {rows.map((student) => (
                <div className="finance-row" key={student.id}>
                  <div className="between">
                    <strong>{student.full_name}</strong>
                    <span>{student.monthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                  <div className="bar-track"><span style={{ width: `${Math.max(6, (student.monthly / max) * 100)}%` }} /></div>
                  <small className="muted">{student.weeklyClasses} aulas/semana x {(student.price_per_class || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</small>
                  <div className="payment-toggle" role="group" aria-label={`Pagamento de ${student.full_name}`}>
                    <button className={student.payment === 'paid' ? 'selected paid' : ''} onClick={() => updatePayment(student.id, 'paid')}>Pago</button>
                    <button className={student.payment === 'unpaid' ? 'selected unpaid' : ''} onClick={() => updatePayment(student.id, 'unpaid')}>Não pago</button>
                  </div>
                  <div className="billing-actions">
                    <button className="btn" onClick={() => downloadReceipt(student)}>Baixar recibo</button>
                    <a className="btn" href={whatsappCharge(student)} target="_blank">Cobrar no WhatsApp</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type NewsArticle = {
  title: string;
  link: string;
  source: string;
  published_at: string;
};

export function TeacherNewsPanel() {
  const [subject, setSubject] = useState('Matemática');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load(nextSubject = subject) {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<{ articles: NewsArticle[] }>(`/api/teacher/news?subject=${encodeURIComponent(nextSubject)}`);
      setArticles(data.articles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar notícias.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load('Matemática');
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    load(subject);
  }

  return (
    <div className="stack">
      <PanelHeader eyebrow="Curadoria" title="Notícias" text="Busque assuntos recentes para enriquecer suas aulas." />
      <form className="card news-search" onSubmit={submit}>
        <div>
          <span className="eyebrow">Notícias por matéria</span>
          <h2>Atualizações para preparar aulas</h2>
        </div>
        <div className="row grow">
          <input className="input grow" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex.: matemática, biologia, português" />
          <button className="btn primary" disabled={loading}>{loading ? 'Buscando...' : 'Buscar'}</button>
        </div>
      </form>
      <StatusMessage error={error} loading={loading} />
      {!loading && articles.length === 0 && <EmptyState title="Nenhuma notícia encontrada" text="Tente outra matéria ou palavra-chave." />}
      <div className="news-grid">
        {articles.map((article) => (
          <a className="card news-card" href={article.link} target="_blank" key={`${article.title}-${article.published_at}`}>
            <span className="eyebrow">{article.source}</span>
            <h2>{article.title}</h2>
            <p className="muted">{article.published_at ? new Date(article.published_at).toLocaleDateString('pt-BR') : 'Data não informada'}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

export function StudentsPanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const emptyForm = { full_name: '', email: '', whatsapp: '', guardian_whatsapp: '', subject: '', days_of_week: '1,3', class_time: '14:00', classes_per_week: '2', price_per_class: '100' };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [regenerateSchedule, setRegenerateSchedule] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const data = await apiFetch<{ students: Student[] }>('/api/teacher/students');
      setStudents(data.students);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar alunos.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  function toggleDay(day: string) {
    const selected = form.days_of_week ? form.days_of_week.split(',').filter(Boolean) : [];
    const next = selected.includes(day) ? selected.filter((item) => item !== day) : [...selected, day];
    setForm({ ...form, days_of_week: next.sort().join(',') });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (!isValidBrazilPhone(form.whatsapp)) {
        throw new Error('Informe um WhatsApp brasileiro valido com DDD, usando 10 ou 11 digitos.');
      }
      if (form.guardian_whatsapp && !isValidBrazilPhone(form.guardian_whatsapp)) {
        throw new Error('Informe um WhatsApp brasileiro valido para o responsável com DDD, usando 10 ou 11 digitos.');
      }
      const cleanForm = {
        ...form,
        whatsapp: normalizeBrazilPhone(form.whatsapp),
        guardian_whatsapp: form.guardian_whatsapp ? normalizeBrazilPhone(form.guardian_whatsapp) : null,
      };
      if (editingId) {
        await apiFetch(`/api/teacher/students/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ ...cleanForm, classes_per_week: Number(form.classes_per_week || 0), price_per_class: Number(form.price_per_class || 0), duration_minutes: 60, regenerate_schedule: regenerateSchedule }),
        });
      } else {
        await apiFetch('/api/teacher/students', { method: 'POST', body: JSON.stringify({ ...cleanForm, classes_per_week: Number(form.classes_per_week || 0), price_per_class: Number(form.price_per_class || 0), duration_minutes: 60 }) });
      }
      setForm(emptyForm);
      setEditingId('');
      setIsFormOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar aluno.');
    } finally {
      setSaving(false);
    }
  }

  function editStudent(student: Student) {
    setEditingId(student.id);
    setIsFormOpen(true);
    setForm({
      full_name: student.full_name,
      email: student.email,
      whatsapp: formatBrazilWhatsapp(student.whatsapp || ''),
      guardian_whatsapp: formatBrazilWhatsapp(student.guardian_whatsapp || ''),
      subject: student.subject || '',
      days_of_week: student.days_of_week?.join(',') || '',
      class_time: student.class_time || '14:00',
      classes_per_week: String(student.classes_per_week || 2),
      price_per_class: String(student.price_per_class || 100),
    });
    setRegenerateSchedule(true);
  }

  async function deleteStudent(student: Student) {
    const ok = window.confirm(`Excluir ${student.full_name}? Isso remove agenda, atividades, entregas e recados vinculados.`);
    if (!ok) return;
    await apiFetch(`/api/teacher/students/${student.id}`, { method: 'DELETE' });
    await load();
  }

  function cancelEdit() {
    setEditingId('');
    setForm(emptyForm);
    setIsFormOpen(false);
  }

  const selectedDays = useMemo(() => form.days_of_week.split(',').filter(Boolean), [form.days_of_week]);
  const monthlyValue = (Number(form.classes_per_week || 0) * Number(form.price_per_class || 0) * 4).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="stack">
      <PanelHeader eyebrow="Administração" title="Alunos" text="Cadastre, edite a agenda e acompanhe valores." />
      <div className="panel-toolbar">
        <div>
          <span className="eyebrow">Gestão de alunos</span>
          <h2>{students.length} aluno{students.length === 1 ? '' : 's'} cadastrado{students.length === 1 ? '' : 's'}</h2>
        </div>
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            setEditingId('');
            setForm(emptyForm);
            setRegenerateSchedule(true);
            setIsFormOpen((current) => (editingId ? true : !current));
          }}
        >
          {isFormOpen && !editingId ? 'Fechar cadastro' : 'Novo aluno'}
        </button>
      </div>
      {isFormOpen && (
      <form className="card stack collapsible-form" onSubmit={submit}>
        <div>
          <span className="eyebrow">Cadastro vinculado</span>
          <h2>{editingId ? 'Editar aluno' : 'Novo aluno'}</h2>
        </div>
        <StatusMessage error={error} loading={false} />
        <Input label="Nome" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
        <Input label="E-mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Input label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: formatBrazilWhatsapp(v) })} inputMode="numeric" placeholder="(11) 99999-9999" required={false} />
        <Input label="WhatsApp do responsável" value={form.guardian_whatsapp} onChange={(v) => setForm({ ...form, guardian_whatsapp: formatBrazilWhatsapp(v) })} inputMode="numeric" placeholder="(11) 99999-9999" required={false} />
        <Input label="Matéria" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} />
        <label className="label">Dias das aulas</label>
        <div className="segmented">
          {weekDays.map((day) => (
            <button type="button" className={selectedDays.includes(day.value) ? 'selected' : ''} onClick={() => toggleDay(day.value)} key={day.value}>
              {day.label}
            </button>
          ))}
        </div>
        <Input label="Horário" type="time" value={form.class_time} onChange={(v) => setForm({ ...form, class_time: v })} />
        <div className="grid grid-2 compact-grid">
          <Input label="Aulas por semana" type="number" value={form.classes_per_week} onChange={(v) => setForm({ ...form, classes_per_week: v })} />
          <Input label="Valor por aula" type="number" value={form.price_per_class} onChange={(v) => setForm({ ...form, price_per_class: v })} />
        </div>
        <div className="panel-note">Previsão mensal: <strong>{monthlyValue}</strong></div>
        {editingId && (
          <label className="check-row">
            <input type="checkbox" checked={regenerateSchedule} onChange={(event) => setRegenerateSchedule(event.target.checked)} />
            Recriar aulas futuras com estes dias e horário
          </label>
        )}
        <div className="row">
          <button className="btn primary" disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar e gerar agenda'}</button>
          {editingId && <button type="button" className="btn" onClick={cancelEdit}>Cancelar edição</button>}
          {!editingId && <button type="button" className="btn" onClick={() => setIsFormOpen(false)}>Cancelar</button>}
        </div>
      </form>
      )}
      <div className="stack">
        <StatusMessage error="" loading={loading} />
        {!loading && students.length === 0 && <EmptyState title="Nenhum aluno ainda" text="Cadastre ou peça para o aluno usar o código do professor." />}
        {students.map((student) => (
          <div className="card list-item" key={student.id}>
            <div>
              <strong>{student.full_name}</strong>
              <p className="muted">{student.email} - {student.subject || 'Sem matéria'}</p>
              <small>{student.class_time ? `Aulas às ${student.class_time}` : 'Horário não definido'}</small>
              <p className="muted">{student.classes_per_week || 0} aulas/semana - {Number(student.price_per_class || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por aula - mensal: {Number((student.classes_per_week || 0) * (student.price_per_class || 0) * 4).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>
            <div className="row">
              <span className="badge">{statusLabel(student.status)}</span>
              <button className="btn small" onClick={() => editStudent(student)}>Editar</button>
              <button className="btn small danger" onClick={() => deleteStudent(student)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeacherSchedulePanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [form, setForm] = useState({ student_id: '', class_date: new Date().toISOString().slice(0, 10), class_time: '14:00' });
  const [editingClassId, setEditingClassId] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const [s, c] = await Promise.all([
        apiFetch<{ students: Student[] }>('/api/teacher/students'),
        apiFetch<{ classes: ClassSchedule[] }>('/api/teacher/schedule'),
      ]);
      setStudents(s.students);
      setClasses(c.classes);
      if (!form.student_id && s.students[0]) setForm((current) => ({ ...current, student_id: s.students[0].id }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar agenda.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  async function generateClassLinks() {
    setLinkLoading(true);
    setError('');
    try {
      const data = await apiFetch<{ synced: number; meetLinks?: number }>('/api/google/calendar/sync', { method: 'POST' });
      setError(`${data.meetLinks || 0} aula${data.meetLinks === 1 ? '' : 's'} com link online pronto. ${data.synced} link${data.synced === 1 ? '' : 's'} novo${data.synced === 1 ? '' : 's'} gerado${data.synced === 1 ? '' : 's'}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar links das aulas.');
    } finally {
      setLinkLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.student_id) return;
    if (editingClassId) {
      await apiFetch(`/api/teacher/schedule/${editingClassId}`, { method: 'PATCH', body: JSON.stringify({ class_date: form.class_date, class_time: form.class_time, duration_minutes: 60 }) });
      setEditingClassId('');
    } else {
      await apiFetch('/api/teacher/schedule', { method: 'POST', body: JSON.stringify({ ...form, duration_minutes: 60 }) });
    }
    await load();
  }

  async function updateStatus(id: string, status: string) {
    await apiFetch(`/api/teacher/schedule/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await load();
  }

  function editClass(item: ClassSchedule) {
    setEditingClassId(item.id);
    setForm({ student_id: item.student_id, class_date: item.class_date, class_time: item.class_time.slice(0, 5) });
  }

  async function deleteClass(id: string) {
    const ok = window.confirm('Excluir esta aula da agenda?');
    if (!ok) return;
    await apiFetch(`/api/teacher/schedule/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className="stack">
      <PanelHeader eyebrow="Calendario" title="Agenda" text="Organize aulas e atualize status rapidamente." />
      <div className="row">
        <button className="btn" onClick={() => downloadScheduleIcs(classes, 'agenda-lumina-professor.ics', 'Professor')}>Exportar agenda</button>
        <button className="btn" onClick={requestReminderPermission}>Ativar lembretes</button>
      </div>
      <div className="card stack">
        <div className="glass-card-head">
          <div>
            <span className="eyebrow">Agenda externa</span>
            <h2>Links de aula sem aprovação do Google</h2>
          </div>
          <span className="badge status-success">
            Sem OAuth
          </span>
        </div>
        <p className="muted">Gere links online para as aulas e use a exportação de agenda sem pedir permissão sensível ao Google.</p>
        <div className="row">
          <button className="btn primary" onClick={generateClassLinks} disabled={linkLoading}>{linkLoading ? 'Gerando...' : 'Gerar links das aulas'}</button>
        </div>
      </div>
      <div className="grid grid-2">
      <form className="card stack" onSubmit={submit}>
        <h2>{editingClassId ? 'Editar aula' : 'Agendar aula'}</h2>
        <StatusMessage error={error} loading={false} />
        <label className="label">Aluno<select className="input" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}>{students.map((s) => <option value={s.id} key={s.id}>{s.full_name}</option>)}</select></label>
        <Input label="Data" type="date" value={form.class_date} onChange={(v) => setForm({ ...form, class_date: v })} />
        <Input label="Horário" type="time" value={form.class_time} onChange={(v) => setForm({ ...form, class_time: v })} />
        <div className="row">
          <button className="btn primary" disabled={!students.length}>{editingClassId ? 'Salvar aula' : 'Agendar'}</button>
          {editingClassId && <button type="button" className="btn" onClick={() => setEditingClassId('')}>Cancelar</button>}
        </div>
      </form>
      <div className="stack">
        <StatusMessage error="" loading={loading} />
        {!loading && classes.length === 0 && <EmptyState title="Agenda vazia" text="Crie um aluno com dias e horário ou agende uma aula manualmente." />}
        {classes.map((item) => (
          <div className="card" key={item.id}>
            <div className="list-item">
              <div>
                <strong>{item.students?.full_name || item.student_id}</strong>
                <p className="muted">{item.class_date} às {item.class_time} - {statusLabel(item.status)}</p>
              </div>
              {item.student_confirmed && <span className="badge">Confirmada</span>}
            </div>
            <div className="row">
              <button className="btn" onClick={() => updateStatus(item.id, 'completed')}>Realizada</button>
              <button className="btn" onClick={() => updateStatus(item.id, 'cancelled')}>Cancelar</button>
              <button className="btn" onClick={() => updateStatus(item.id, 'absence')}>Falta</button>
              <button className="btn" onClick={() => editClass(item)}>Editar</button>
              <button className="btn danger" onClick={() => deleteClass(item.id)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

export function TeacherActivitiesPanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);
  const [form, setForm] = useState({ title: '', description: '', subject: '', student_id: '', due_date: '' });
  const [file, setFile] = useState<File | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [correctingId, setCorrectingId] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const [s, a, delivered] = await Promise.all([
        apiFetch<{ students: Student[] }>('/api/teacher/students'),
        apiFetch<{ activities: Activity[] }>('/api/teacher/activities'),
        apiFetch<{ submissions: ActivitySubmission[] }>('/api/teacher/submissions'),
      ]);
      setStudents(s.students);
      setActivities(a.activities);
      setSubmissions(delivered.submissions);
      setGrades((current) => {
        const next = { ...current };
        delivered.submissions.forEach((submission) => {
          if (next[submission.id] === undefined) next[submission.id] = submission.grade != null ? String(submission.grade) : '10';
        });
        return next;
      });
      setFeedbacks((current) => {
        const next = { ...current };
        delivered.submissions.forEach((submission) => {
          if (next[submission.id] === undefined) next[submission.id] = submission.feedback || 'Corrigida pelo professor.';
        });
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar atividades.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const uploaded = file ? await uploadFile(file) : null;
      await apiFetch('/api/teacher/activities', { method: 'POST', body: JSON.stringify({ ...form, points: 10, student_id: form.student_id || undefined, file_url: uploaded?.url }) });
      setForm({ title: '', description: '', subject: '', student_id: '', due_date: '' });
      setFile(null);
      setIsFormOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar atividade.');
    } finally {
      setSaving(false);
    }
  }

  async function correct(id: string) {
    const gradeValue = Number(grades[id] ?? '10');
    if (Number.isNaN(gradeValue) || gradeValue < 0 || gradeValue > 10) {
      setError('A nota precisa estar entre 0 e 10.');
      return;
    }

    setCorrectingId(id);
    setError('');
    try {
      await apiFetch(`/api/teacher/submissions/${id}/correct`, {
        method: 'PATCH',
        body: JSON.stringify({ grade: gradeValue, feedback: feedbacks[id] || 'Corrigida pelo professor.' }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao corrigir atividade.');
    } finally {
      setCorrectingId('');
    }
  }

  const correctedSubmissions = submissions.filter((submission) => submission.status === 'corrected');
  const toCorrectSubmissions = submissions.filter((submission) => submission.status !== 'corrected');
  const pendingActivities = activities.filter((activity) => !submissions.some((submission) => submission.activity_id === activity.id));

  function renderSubmissionCard(submission: ActivitySubmission, editable: boolean) {
    return (
      <div className="card stack" key={submission.id}>
        <div className="list-item">
          <div>
            <strong>{submission.activities?.title || 'Atividade'}</strong>
            <p className="muted">{submission.students?.full_name || 'Aluno'} - {statusLabel(submission.status)}</p>
          </div>
          {submission.grade != null && <span className="badge">Nota {submission.grade}</span>}
        </div>
        <p>{submission.answer_text || 'Sem resposta em texto.'}</p>
        {submission.answer_file_url && <a className="file-link" href={submission.answer_file_url} target="_blank">Arquivo entregue pelo aluno</a>}
        {editable ? (
          <>
            <Input label="Nota" type="number" value={grades[submission.id] ?? (submission.grade != null ? String(submission.grade) : '10')} onChange={(value) => setGrades((current) => ({ ...current, [submission.id]: value }))} />
            <label className="label">Feedback<textarea className="input textarea" value={feedbacks[submission.id] ?? submission.feedback ?? ''} onChange={(event) => setFeedbacks((current) => ({ ...current, [submission.id]: event.target.value }))} /></label>
            <button className="btn primary" disabled={correctingId === submission.id} onClick={() => correct(submission.id)}>{correctingId === submission.id ? 'Corrigindo...' : 'Corrigir'}</button>
          </>
        ) : (
          <div className="panel-note">
            <strong>Correção enviada.</strong>
            <p>{submission.feedback || 'Sem feedback registrado.'}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="stack">
      <PanelHeader eyebrow="Tarefas" title="Atividades" text="Publique, receba arquivos e corrijá entregas." />
      <div className="panel-toolbar">
        <div>
          <span className="eyebrow">Central de atividades</span>
          <h2>{activities.length} atividade{activities.length === 1 ? '' : 's'} publicada{activities.length === 1 ? '' : 's'}</h2>
        </div>
        <button type="button" className="btn primary" onClick={() => setIsFormOpen((current) => !current)}>
          {isFormOpen ? 'Fechar criação' : 'Nova atividade'}
        </button>
      </div>
      {isFormOpen && (
      <form className="card stack collapsible-form" onSubmit={submit}>
        <h2>Nova atividade</h2>
        <StatusMessage error={error} loading={false} />
        <Input label="Título" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <label className="label">Descrição<textarea className="input textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <Input label="Matéria" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} />
        <label className="label">Aluno<select className="input" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}><option value="">Todos</option>{students.map((s) => <option value={s.id} key={s.id}>{s.full_name}</option>)}</select></label>
        <Input label="Prazo" type="date" value={form.due_date} onChange={(v) => setForm({ ...form, due_date: v })} />
        <label className="label">Arquivo da atividade<input className="input" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
        <div className="row">
          <button className="btn primary" disabled={saving}>{saving ? 'Enviando...' : 'Criar'}</button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setForm({ title: '', description: '', subject: '', student_id: '', due_date: '' });
              setFile(null);
              setIsFormOpen(false);
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
      )}
      <div className="stack">
        <StatusMessage error="" loading={loading} />
        {!loading && activities.length === 0 && <EmptyState title="Nenhuma atividade" text="Crie uma atividade para todos os alunos ou para um aluno específico." />}
        <section className="activity-review-section stack">
          <div className="glass-card-head">
            <strong>Para corrigir</strong>
            <span>{toCorrectSubmissions.length} entrega{toCorrectSubmissions.length === 1 ? '' : 's'}</span>
          </div>
          {!loading && toCorrectSubmissions.length === 0 && <EmptyState title="Nada para corrigir" text="As novas entregas dos alunos aparecerão aqui." />}
          {toCorrectSubmissions.map((submission) => renderSubmissionCard(submission, true))}
        </section>

        <section className="activity-review-section stack">
          <div className="glass-card-head">
            <strong>Pendentes</strong>
            <span>{pendingActivities.length} atividade{pendingActivities.length === 1 ? '' : 's'}</span>
          </div>
          {!loading && pendingActivities.length === 0 && <EmptyState title="Sem atividades pendentes" text="Todas as atividades publicadas já receberam entrega." />}
          {pendingActivities.map((activity) => (
            <div className="card list-item" key={activity.id}>
              <div>
                <strong>{activity.title}</strong>
                <p className="muted">{activity.students?.full_name || 'Todos'} - aguardando entrega</p>
                {activity.file_url && <a className="file-link" href={activity.file_url} target="_blank">Arquivo da atividade</a>}
              </div>
              <span className="badge">{activity.due_date || 'Sem prazo'}</span>
            </div>
          ))}
        </section>

        <section className="activity-review-section stack">
          <div className="glass-card-head">
            <strong>Corrigidas</strong>
            <span>{correctedSubmissions.length} entrega{correctedSubmissions.length === 1 ? '' : 's'}</span>
          </div>
          {!loading && correctedSubmissions.length === 0 && <EmptyState title="Nenhuma atividade corrigida" text="As atividades corrigidas ficarão registradas aqui." />}
          {correctedSubmissions.map((submission) => renderSubmissionCard(submission, false))}
        </section>
      </div>
    </div>
  );
}

export function TeacherMessagesPanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function load(nextStudentId = studentId) {
    try {
      setError('');
      const studentsData = await apiFetch<{ students: Student[] }>('/api/teacher/students');
      setStudents(studentsData.students);
      const selected = nextStudentId || studentsData.students[0]?.id || '';
      setStudentId(selected);
      if (selected) {
        const data = await apiFetch<{ messages: Message[] }>(`/api/messages?student_id=${selected}`);
        setMessages(data.messages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar recados.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(() => load());

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!studentId || (!text.trim() && !file)) return;
    setSending(true);
    setError('');
    try {
      const uploaded = file ? await uploadFile(file) : null;
      await apiFetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId,
          text,
          attachment_url: uploaded?.url,
          attachment_name: file?.name,
          attachment_type: file?.type,
        }),
      });
      setText('');
      setFile(null);
      await load(studentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar recado.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="stack portal-tab messages-panel">
      <PanelHeader eyebrow="Comunicação" title="Recados" text="Converse com cada aluno em um histórico simples." />
      <div className="grid grid-2">
      <div className="card stack message-composer-card">
        <h2>Conversa</h2>
        <StatusMessage error={error} loading={loading} />
        <select className="input" value={studentId} onChange={(e) => load(e.target.value)}>{students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select>
        <form className="message-compose-form" onSubmit={send}>
          <textarea className="input textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="Digite um recado" />
          <label className="message-file-picker">
            <span>{file ? file.name : 'Foto, vídeo ou arquivo'}</span>
            <input type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <button className="btn primary" disabled={!studentId || sending}>{sending ? 'Enviando...' : 'Enviar'}</button>
        </form>
      </div>
      <div className="stack">
        {!loading && messages.length === 0 && <EmptyState title="Sem recados" text="As mensagens trocadas com o aluno aparecem aqui." />}
        <MessageThread messages={messages} currentRole="teacher" />
      </div>
      </div>
    </div>
  );
}

type LessonPlan = {
  title: string;
  summary: string;
  steps: string[];
  materials: string[];
  homework: string;
};

export function LessonPlannerPanel() {
  const [form, setForm] = useState({ subject: '', topic: '', level: '', duration: '60 minutos', objective: '' });
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<{ plan: LessonPlan }>('/api/teacher/lesson-plan', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setPlan(data.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar plano.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <PanelHeader eyebrow="Planejamento" title="Planos de aula" text="Monte uma estrutura objetiva para a próxima aula." />
      <div className="grid grid-2">
      <form className="card stack" onSubmit={submit}>
        <div>
          <span className="eyebrow">Assistente do professor</span>
          <h2>Planejar aula</h2>
        </div>
        <StatusMessage error={error} loading={false} />
        <Input label="Matéria" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} />
        <Input label="Tema da aula" value={form.topic} onChange={(v) => setForm({ ...form, topic: v })} />
        <Input label="Nivel do aluno" value={form.level} onChange={(v) => setForm({ ...form, level: v })} />
        <Input label="Duracao" value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} />
        <label className="label">Objetivo<textarea className="input textarea" value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} /></label>
        <button className="btn primary" disabled={loading}>{loading ? 'Gerando...' : 'Gerar plano'}</button>
      </form>
      <div className="stack">
        {!plan && <EmptyState title="Plano pronto para montar" text="Informe matéria, tema e objetivo para receber uma estrutura de aula." />}
        {plan && (
          <div className="card stack">
            <div>
              <span className="eyebrow">Plano sugerido</span>
              <h2>{plan.title}</h2>
              <p className="muted">{plan.summary}</p>
            </div>
            <div>
              <strong>Roteiro</strong>
              <ol className="clean-list">{plan.steps.map((step) => <li key={step}>{step}</li>)}</ol>
            </div>
            <div>
              <strong>Materiais</strong>
              <ul className="clean-list">{plan.materials.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <div className="panel-note"><strong>Tarefa sugerida:</strong> {plan.homework}</div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', inputMode, placeholder, required = true }: { label: string; value: string; onChange: (value: string) => void; type?: string; inputMode?: 'numeric'; placeholder?: string; required?: boolean }) {
  return <label className="label">{label}<input className="input" type={type} inputMode={inputMode} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} required={required} /></label>;
}
