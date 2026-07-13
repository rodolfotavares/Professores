import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);

    const { data: students, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at');

    if (error) throw error;
    const primary = students?.[0] || null;

    const studentIds = (students || []).map((student) => student.id);
    const { data: links, error: linksError } = studentIds.length
      ? await supabaseAdmin
        .from('teacher_student_links')
        .select('*')
        .in('student_id', studentIds)
        .order('created_at')
      : { data: [], error: null } as any;
    if (linksError) throw linksError;

    return json({ student: primary, students: students || [], links: links || [] });
  } catch (error) {
    return apiError(error);
  }
}
