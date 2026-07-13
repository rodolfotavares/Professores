import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { studentIdsForUser } from '@/lib/student-links';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    const studentIds = await studentIdsForUser(user.id);
    if (!studentIds.length) return json({ activities: [], submissions: [] });

    const { data: links, error: linksError } = await supabaseAdmin
      .from('teacher_student_links')
      .select('teacher_id')
      .in('student_id', studentIds)
      .eq('status', 'active');
    if (linksError) throw linksError;
    const teacherIds = Array.from(new Set((links || []).map((link) => link.teacher_id)));

    const filters = [
      `student_id.in.(${studentIds.join(',')})`,
      teacherIds.length ? `and(student_id.is.null,teacher_id.in.(${teacherIds.join(',')}))` : '',
    ].filter(Boolean).join(',');

    const { data: activities, error } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('visible_to_student', true)
      .or(filters)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const { data: submissions } = await supabaseAdmin
      .from('activity_submissions')
      .select('*, activities(title)')
      .in('student_id', studentIds);

    return json({ activities: activities || [], submissions: submissions || [] });
  } catch (error) {
    return apiError(error);
  }
}
