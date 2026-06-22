import { supabaseAdmin } from './supabase-admin';

const apiBase = 'https://api.mercadopago.com';

export function assertMercadoPagoConfigured() {
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    throw new Response(JSON.stringify({ error: 'Mercado Pago nao configurado.' }), { status: 500 });
  }
}

async function mercadoPagoFetch<T>(path: string, init: RequestInit = {}) {
  assertMercadoPagoConfigured();

  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.message || payload?.error || 'Falha na comunicacao com Mercado Pago.';
    throw new Error(message);
  }
  return payload as T;
}

export type MercadoPagoPreference = {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
};

export type MercadoPagoPayment = {
  id: number;
  status: string;
  status_detail?: string;
  transaction_amount?: number;
  external_reference?: string;
};

export async function createMercadoPagoPreference(input: {
  title: string;
  amount: number;
  payerEmail?: string | null;
  externalReference: string;
  notificationUrl: string;
  backUrl: string;
}) {
  return mercadoPagoFetch<MercadoPagoPreference>('/checkout/preferences', {
    method: 'POST',
    body: JSON.stringify({
      items: [
        {
          title: input.title,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: Number(input.amount.toFixed(2)),
        },
      ],
      payer: input.payerEmail ? { email: input.payerEmail } : undefined,
      external_reference: input.externalReference,
      notification_url: input.notificationUrl,
      back_urls: {
        success: input.backUrl,
        failure: input.backUrl,
        pending: input.backUrl,
      },
      auto_return: 'approved',
    }),
  });
}

export async function getMercadoPagoPayment(id: string) {
  return mercadoPagoFetch<MercadoPagoPayment>(`/v1/payments/${id}`);
}

export async function upsertPaymentRecord(input: {
  teacherId: string;
  studentId: string;
  studentUserId: string | null;
  monthReference: string;
  amount: number;
  status: string;
  paidAmount?: number;
  paidAt?: string | null;
}) {
  const { data: existing } = await supabaseAdmin
    .from('payments')
    .select('id')
    .eq('teacher_id', input.teacherId)
    .eq('student_id', input.studentId)
    .eq('month_reference', input.monthReference)
    .maybeSingle();

  const payload = {
    teacher_id: input.teacherId,
    student_id: input.studentId,
    student_user_id: input.studentUserId,
    month_reference: input.monthReference,
    amount: input.amount,
    paid_amount: input.paidAmount || 0,
    status: input.status,
    paid_at: input.paidAt || null,
  };

  if (existing?.id) {
    const { error } = await supabaseAdmin.from('payments').update(payload).eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await supabaseAdmin.from('payments').insert(payload).select('id').single();
  if (error) throw error;
  return data.id;
}
