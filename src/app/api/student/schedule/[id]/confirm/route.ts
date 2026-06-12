import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getApiUser(req);
    const params = await context.params;
    const { data, error } = await supabaseAdmin
      .from('class_schedules')
      .update({ student_confirmed: true })
      .eq('id', params.id)
      .eq('student_user_id', user.id)
      .select('*')
      .single();

    if (error) throw error;
    return json({ class: data });
  } catch (error) {
    return apiError(error);
  }
}
