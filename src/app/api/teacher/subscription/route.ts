import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const appMonthlyPrice = 39.9;

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return json({ error: 'Sem permissao.' }, { status: 403 });
    }

    const monthReference = new URL(req.url).searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const { data } = await supabaseAdmin
      .from('app_subscriptions')
      .select('*')
      .eq('teacher_id', user.id)
      .eq('month_reference', monthReference)
      .maybeSingle();

    return json({
      subscription: data || {
        month_reference: monthReference,
        amount: appMonthlyPrice,
        status: 'pending',
        paid_at: null,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
