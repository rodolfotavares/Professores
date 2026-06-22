import { NextRequest } from 'next/server';
import { apiError, json } from '@/lib/api-auth';
import { getMercadoPagoPayment, upsertPaymentRecord } from '@/lib/mercadopago';
import { supabaseAdmin } from '@/lib/supabase-admin';

function paymentStatus(status: string) {
  if (status === 'approved') return 'paid';
  if (status === 'cancelled' || status === 'rejected') return 'cancelled';
  return 'pending';
}

async function extractPaymentId(req: NextRequest) {
  const url = new URL(req.url);
  let id = url.searchParams.get('data.id') || url.searchParams.get('id');
  const body = await req.json().catch(() => null);
  id ||= body?.data?.id || body?.id || '';
  if (!id && typeof body?.resource === 'string') {
    id = body.resource.split('/').pop();
  }
  return id ? String(id) : '';
}

export async function POST(req: NextRequest) {
  try {
    const paymentId = await extractPaymentId(req);
    if (!paymentId) return json({ ok: true });

    const payment = await getMercadoPagoPayment(paymentId);
    const [teacherId, studentId, monthReference] = String(payment.external_reference || '').split('|');
    if (!teacherId || !studentId || !monthReference) return json({ ok: true });

    const { data: student } = await supabaseAdmin
      .from('students')
      .select('user_id')
      .eq('id', studentId)
      .eq('teacher_id', teacherId)
      .single();

    await upsertPaymentRecord({
      teacherId,
      studentId,
      studentUserId: student?.user_id || null,
      monthReference,
      amount: payment.transaction_amount || 0,
      paidAmount: payment.status === 'approved' ? payment.transaction_amount || 0 : 0,
      status: paymentStatus(payment.status),
      paidAt: payment.status === 'approved' ? new Date().toISOString() : null,
    });

    return json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
