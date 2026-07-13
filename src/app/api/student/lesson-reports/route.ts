import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { studentIdsForUser } from '@/lib/student-links';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    const studentIds = await studentIdsForUser(user.id);
    if (!studentIds.length) return json({ reports: [] });

    const { data, error } = await supabaseAdmin
      .from('lesson_reports')
      .select('*, students(full_name, subject, guardian_whatsapp), class_schedules(class_date, class_time, subject, duration_minutes, actual_duration_minutes)')
      .in('student_id', studentIds)
      .eq('status', 'PUBLISHED')
      .order('published_at', { ascending: false });

    if (error) throw error;
    return json({ reports: data || [] });
  } catch (error) {
    return apiError(error);
  }
}
