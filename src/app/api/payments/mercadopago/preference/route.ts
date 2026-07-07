import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, getTeacherSubscriptionStatus, json } from '@/lib/api-auth';
import { createMercadoPagoPreference, upsertAppSubscription } from '@/lib/mercadopago';

const schema = z.object({
  month_reference: z.string().min(4).optional(),
});

const appMonthlyPrice = 19.9;

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return json({ error: 'Sem permissao.' }, { status: 403 });
    }

    const body = schema.parse(await req.json());
    const monthReference = body.month_reference || new Date().toISOString().slice(0, 7);

    const externalReference = ['app', user.id, monthReference].join('|');
    const currentSubscription = await getTeacherSubscriptionStatus(user.id, monthReference);
    if (currentSubscription.status !== 'trial') {
      await upsertAppSubscription({
        teacherId: user.id,
        monthReference,
        amount: appMonthlyPrice,
        status: 'pending',
      });
    }

    const preference = await createMercadoPagoPreference({
      title: `Assinatura LuminaAI - ${monthReference}`,
      amount: appMonthlyPrice,
      payerEmail: user.email,
      externalReference,
      notificationUrl: `${req.nextUrl.origin}/api/payments/mercadopago/webhook`,
      backUrl: `${req.nextUrl.origin}/teacher/finance`,
    });

    return json({ preference_id: preference.id, init_point: preference.init_point, sandbox_init_point: preference.sandbox_init_point });
  } catch (error) {
    return apiError(error);
  }
}
