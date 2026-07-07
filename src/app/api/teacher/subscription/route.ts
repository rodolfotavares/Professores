import { NextRequest } from 'next/server';
import { apiError, getApiUser, getTeacherSubscriptionStatus, json } from '@/lib/api-auth';

const appMonthlyPrice = 19.9;

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return json({ error: 'Sem permissao.' }, { status: 403 });
    }

    const monthReference = new URL(req.url).searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const subscription = await getTeacherSubscriptionStatus(user.id, monthReference);

    return json({ subscription: { ...subscription, amount: subscription.amount ?? appMonthlyPrice } });
  } catch (error) {
    return apiError(error);
  }
}
