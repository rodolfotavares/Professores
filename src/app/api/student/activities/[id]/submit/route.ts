import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  answer_text: z.string().optional(),
  answer_file_url: z.string().optional(),
});

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getApiUser(req);
    const body = schema.parse(await req.json());
    const params = await context.params;

    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (studentError || !student) return json({ error: 'Aluno nao encontrado.' }, { status: 404 });

    const { data: activity, error: activityError } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('id', params.id)
      .single();
    if (activityError || !activity) return json({ error: 'Atividade nao encontrada.' }, { status: 404 });

    const isAllowed = activity.student_id === student.id || (!activity.student_id && activity.teacher_id === student.teacher_id);
    if (!isAllowed) return json({ error: 'Atividade nao pertence ao aluno.' }, { status: 403 });

    const isLate = activity.due_date ? new Date() > new Date(`${activity.due_date}T23:59:59`) : false;

    const { data, error } = await supabaseAdmin
      .from('activity_submissions')
      .insert({
        activity_id: activity.id,
        teacher_id: activity.teacher_id,
        student_id: student.id,
        student_user_id: user.id,
        answer_text: body.answer_text || '',
        answer_file_url: body.answer_file_url || null,
        is_late: isLate,
      })
      .select('*, activities(title)')
      .single();

    if (error) throw error;
    return json({ submission: data });
  } catch (error) {
    return apiError(error);
  }
}
