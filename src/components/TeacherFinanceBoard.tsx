'use client';

import { useEffect, useMemo, useState } from 'react';
import { StatusMessage } from '@/components/PanelState';
import { apiFetch } from '@/lib/fetcher';
import type { Student } from '@/types';

function usePanelLoad(load: () => Promise<void>, interval = 15000) {
  useEffect(() => {
    load();
    const timer = window.setInterval(load, interval);
    return () => window.clearInterval(timer);
  }, []);
}

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function monthLabel(value: string) {
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function TeacherFinanceBoard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [paymentMonth, setPaymentMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [paymentStatus, setPaymentStatus] = useState<Record<string, 'paid' | 'unpaid' | 'late'>>({});
  const [subscription, setSubscription] = useState<{
    month_reference: string;
    amount: number;
    status: string;
    paid_at: string | null;
    trial_ends_at?: string;
    trial_days_left?: number;
  } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const subscriptionData = await apiFetch<{ subscription: { month_reference: string; amount: number; status: string; paid_at: string | null; trial_ends_at?: string; trial_days_left?: number } }>(`/api/teacher/subscription?month=${paymentMonth}`);
      setSubscription(subscriptionData.subscription);

      try {
        const studentData = await apiFetch<{ students: Student[] }>('/api/teacher/students');
        setStudents(studentData.students);
      } catch (err) {
        setStudents([]);
        if (['paid', 'exempt', 'trial'].includes(subscriptionData.subscription.status)) throw err;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar financeiro.');
    } finally {
      setLoading(false);
    }
  }

  usePanelLoad(load);

  useEffect(() => {
    const saved = window.localStorage.getItem(`lumina-payments-${paymentMonth}`);
    setPaymentStatus(saved ? JSON.parse(saved) : {});
  }, [paymentMonth]);

  useEffect(() => {
    load();
  }, [paymentMonth]);

  function setStudentPayment(studentId: string, status: 'paid' | 'unpaid' | 'late') {
    setPaymentStatus((current) => {
      const next = { ...current, [studentId]: status };
      window.localStorage.setItem(`lumina-payments-${paymentMonth}`, JSON.stringify(next));
      return next;
    });
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

  const rows = useMemo(() => {
    return students.map((student, index) => {
      const weeklyClasses = student.classes_per_week || Math.ceil((student.classes_per_month || 0) / 4);
      const monthly = weeklyClasses * Number(student.price_per_class || 0) * 4;
      const fallbackStatus = index % 5 === 2 ? 'late' : 'unpaid';
      const payment = paymentStatus[student.id] || fallbackStatus;
      return { ...student, weeklyClasses, monthly, payment };
    });
  }, [paymentStatus, students]);

  const paidTotal = rows.filter((student) => student.payment === 'paid').reduce((sum, student) => sum + student.monthly, 0);
  const lateTotal = rows.filter((student) => student.payment === 'late').reduce((sum, student) => sum + student.monthly, 0);
  const pendingTotal = rows.filter((student) => student.payment === 'unpaid').reduce((sum, student) => sum + student.monthly, 0);
  const forecastTotal = paidTotal + pendingTotal + lateTotal;
  const chartLabels = ['01', '05', '09', '13', '17', '21', '25', '29'];
  const chartPoints = [0.14, 0.26, 0.38, 0.52, 0.66, 0.78, 0.9, 1].map((factor, index) => {
    const base = forecastTotal || 0;
    return Math.round(base * factor + (base > 0 ? index * 55 : index * 90));
  });
  const maxChart = Math.max(...chartPoints, forecastTotal, 1000);
  const chartCeiling = Math.ceil(maxChart / 1000) * 1000;
  const yAxisValues = Array.from({ length: 6 }, (_, index) => Math.round(chartCeiling - (chartCeiling / 5) * index));
  const subscriptionActive = subscription?.status === 'paid' || subscription?.status === 'exempt' || subscription?.status === 'trial';
  const isTrial = subscription?.status === 'trial';

  return (
    <div className="finance-reference-page">
      <section className="finance-reference-main">
        <div className="finance-reference-header">
          <div>
            <h1>Financeiro</h1>
            <p>Acompanhe seus ganhos sem complicação.</p>
          </div>
          <div className="finance-header-actions">
            <label className="finance-month-select">
              <span>▣</span>
              <input type="month" value={paymentMonth} onChange={(event) => setPaymentMonth(event.target.value)} aria-label="Mês de referência" />
              <strong>{monthLabel(paymentMonth)}</strong>
            </label>
            <button className="new-student-button" type="button" onClick={() => setShowRegister((current) => !current)}>
              <span>+</span> Registrar pagamento
            </button>
          </div>
        </div>
        <StatusMessage error={error} loading={loading} />

        {isTrial && (
          <div className="finance-app-subscription trial">
            <div>
              <strong>Teste grátis ativo</strong>
              <span>
                Você ainda tem {subscription?.trial_days_left || 0} dia{subscription?.trial_days_left === 1 ? '' : 's'} grátis.
                Depois disso, a mensalidade de R$ 39,90 será necessária para continuar usando o app.
              </span>
            </div>
            <button type="button" onClick={createMercadoPagoCheckout} disabled={checkoutLoading}>
              {checkoutLoading ? 'Gerando...' : 'Pagar agora'}
            </button>
          </div>
        )}

        {!subscriptionActive && (
          <div className="finance-app-subscription">
            <div>
              <strong>Assinatura LuminaAI Pro</strong>
              <span>Seu teste grátis terminou. Para usar o app, regularize a mensalidade de R$ 39,90.</span>
            </div>
            <button type="button" onClick={createMercadoPagoCheckout} disabled={checkoutLoading}>
              {checkoutLoading ? 'Gerando...' : 'Pagar assinatura'}
            </button>
          </div>
        )}

        {showRegister && (
          <div className="finance-register-strip">
            {rows.slice(0, 6).map((student) => (
              <button type="button" key={student.id} onClick={() => setStudentPayment(student.id, 'paid')}>
                <span>{initials(student.full_name)}</span>
                <strong>{student.full_name}</strong>
                <small>{money(student.monthly)}</small>
              </button>
            ))}
          </div>
        )}

        <div className="finance-summary-card">
          <div>
            <span>Recebido no mês</span>
            <strong className="green">{money(paidTotal)}</strong>
          </div>
          <div>
            <span>A receber</span>
            <strong className="orange">{money(pendingTotal)}</strong>
          </div>
          <div>
            <span>Em atraso</span>
            <strong className="red">{money(lateTotal)}</strong>
          </div>
        </div>

        <section className="finance-chart-card">
          <div className="finance-section-head">
            <h2>Ganhos no mês</h2>
            <div><button className="active" type="button">Mês</button><button type="button">Ano</button></div>
          </div>
          <div className="finance-chart-area">
            <div className="finance-y-axis">
              {yAxisValues.map((value) => <span key={value}>{money(value)}</span>)}
            </div>
            <svg className="finance-svg-chart" viewBox="0 0 760 300" preserveAspectRatio="none" aria-label="Gráfico de ganhos">
              <defs>
                <linearGradient id="financeArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.34" />
                  <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.04" />
                </linearGradient>
              </defs>
              {[24, 72, 120, 168, 216, 264].map((y) => <line key={y} x1="0" x2="760" y1={y} y2={y} />)}
              {(() => {
                const coords = chartPoints.map((value, index) => {
                  const x = chartPoints.length === 1 ? 380 : index * (760 / (chartPoints.length - 1));
                  const y = 264 - Math.min(220, (value / chartCeiling) * 220);
                  return [x, y] as const;
                });
                const path = coords.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
                const area = `${path} L 760 284 L 0 284 Z`;
                return (
                  <>
                    <path className="finance-area-path" d={area} />
                    <path className="finance-line-path" d={path} />
                    {coords.map(([x, y], index) => (
                      <g key={`${x}-${y}`}>
                        <circle cx={x} cy={y} r="5" />
                        <text className="finance-point-value" x={x} y={Math.max(18, y - 12)}>{money(chartPoints[index]).replace('R$', '').trim()}</text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
            <div className="finance-x-axis">
              {chartLabels.map((label) => <span key={label}>{label} {monthLabel(paymentMonth).slice(0, 3)}</span>)}
            </div>
          </div>
        </section>

        <section className="finance-receivables-card">
          <h2>Próximos recebimentos</h2>
          <div className="finance-table">
            <div className="finance-table-head"><span>Aluno</span><span>Vencimento</span><span>Valor</span><span>Status</span><span>Ação</span></div>
            {rows.slice(0, 8).map((student, index) => (
              <div className="finance-table-row" key={student.id}>
                <span><i>{initials(student.full_name)}</i>{student.full_name}</span>
                <span>{index === 0 ? '16/06/2026 (Hoje)' : `${18 + index}/06/2026`}</span>
                <span>{money(student.monthly || student.price_per_class || 0)}</span>
                <em className={student.payment === 'paid' ? 'paid' : student.payment === 'late' ? 'late' : 'pending'}>
                  {student.payment === 'paid' ? 'Hoje' : student.payment === 'late' ? 'Em atraso' : 'Pendente'}
                </em>
                <button type="button" onClick={() => setStudentPayment(student.id, student.payment === 'paid' ? 'unpaid' : 'paid')}>
                  {student.payment === 'paid' ? 'Desmarcar' : 'Marcar pago'}
                </button>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
