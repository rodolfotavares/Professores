import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (studentError || !student) return json({ error: 'Aluno nao encontrado.' }, { status: 404 });

    const { data: activities, error } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('visible_to_student', true)
      .or(`student_id.eq.${student.id},and(student_id.is.null,teacher_id.eq.${student.teacher_id})`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const { data: submissions } = await supabaseAdmin
      .from('activity_submissions')
      .select('*, activities(title)')
      .eq('student_id', student.id);

    return json({ activities: activities || [], submissions: submissions || [] });
  } catch (error) {
    return apiError(error);
  }
}
