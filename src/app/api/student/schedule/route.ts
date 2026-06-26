import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    const { data, error } = await supabaseAdmin
      .from('class_schedules')
      .select('id, teacher_id, student_id, student_user_id, subject, class_date, class_time, duration_minutes, status, student_confirmed, started_at, finished_at, actual_duration_minutes, teacher_present, smart_status, meeting_provider, meeting_url, external_meeting_id')
      .eq('student_user_id', user.id)
      .order('class_date')
      .order('class_time');

    if (error) throw error;
    return json({ classes: data || [] });
  } catch (error) {
    return apiError(error);
  }
}
