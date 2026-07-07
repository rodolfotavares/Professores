import { NextRequest } from 'next/server';
import { apiError, json } from '@/lib/api-auth';
import { getMercadoPagoPayment, upsertAppSubscription, upsertPaymentRecord } from '@/lib/mercadopago';
import { supabaseAdmin } from '@/lib/supabase-admin';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const monthPattern = /^\d{4}-\d{2}$/;

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
  const value = id ? String(id) : '';
  return /^\d+$/.test(value) ? value : '';
}

function validAppReference(parts: string[]) {
  return parts.length === 3 && parts[0] === 'app' && uuidPattern.test(parts[1]) && monthPattern.test(parts[2]);
}

function validStudentPaymentReference(parts: string[]) {
  return parts.length === 3 && uuidPattern.test(parts[0]) && uuidPattern.test(parts[1]) && monthPattern.test(parts[2]);
}

export async function POST(req: NextRequest) {
  try {
    const paymentId = await extractPaymentId(req);
    if (!paymentId) return json({ ok: true });

    const payment = await getMercadoPagoPayment(paymentId);
    const referenceParts = String(payment.external_reference || '').split('|');
    if (referenceParts[0] === 'app') {
      if (!validAppReference(referenceParts)) return json({ ok: true });
      const [, teacherId, monthReference] = referenceParts;

      await upsertAppSubscription({
        teacherId,
        monthReference,
        amount: payment.transaction_amount || 19.9,
        status: paymentStatus(payment.status),
        mercadoPagoPaymentId: String(payment.id),
        paidAt: payment.status === 'approved' ? new Date().toISOString() : null,
      });

      return json({ ok: true });
    }

    if (!validStudentPaymentReference(referenceParts)) return json({ ok: true });
    const [teacherId, studentId, monthReference] = referenceParts;

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
