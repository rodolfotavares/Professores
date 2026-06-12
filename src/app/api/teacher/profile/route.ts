import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return json({ error: 'Sem permissao.' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('teacher_profiles')
      .select('access_code, subjects, default_price_per_class')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return json({ profile: { full_name: user.full_name, email: user.email, ...data } });
  } catch (error) {
    return apiError(error);
  }
}
