import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    const { data, error } = await supabaseAdmin
      .from('class_schedules')
      .select('*')
      .eq('student_user_id', user.id)
      .order('class_date')
      .order('class_time');

    if (error) throw error;
    return json({ classes: data || [] });
  } catch (error) {
    return apiError(error);
  }
}
