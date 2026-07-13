import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { studentIdsForUser } from '@/lib/student-links';

const schema = z.object({
  answer_text: z.string().optional(),
  answer_file_url: z.string().url().optional(),
}).refine((value) => Boolean(value.answer_text?.trim() || value.answer_file_url), {
  message: 'Envie uma resposta ou um arquivo.',
});

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getApiUser(req);
    const body = schema.parse(await req.json());
    const params = await context.params;

    const studentIds = await studentIdsForUser(user.id);
    if (!studentIds.length) return json({ error: 'Aluno nao encontrado.' }, { status: 404 });

    const { data: activity, error: activityError } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('id', params.id)
      .single();
    if (activityError || !activity) return json({ error: 'Atividade nao encontrada.' }, { status: 404 });

    let studentId = activity.student_id && studentIds.includes(activity.student_id) ? activity.student_id : '';

    if (!studentId && !activity.student_id) {
      const { data: link } = await supabaseAdmin
        .from('teacher_student_links')
        .select('student_id')
        .eq('teacher_id', activity.teacher_id)
        .in('student_id', studentIds)
        .eq('status', 'active')
        .maybeSingle();
      studentId = link?.student_id || '';
    }

    if (!studentId) return json({ error: 'Atividade nao pertence ao aluno.' }, { status: 403 });

    const isLate = activity.due_date ? new Date() > new Date(`${activity.due_date}T23:59:59`) : false;

    const payload = {
      activity_id: activity.id,
      teacher_id: activity.teacher_id,
      student_id: studentId,
      student_user_id: user.id,
      answer_text: body.answer_text?.trim() || '',
      answer_file_url: body.answer_file_url || null,
      is_late: isLate,
      status: 'submitted',
      grade: null,
      feedback: '',
    };

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('activity_submissions')
      .select('id')
      .eq('activity_id', activity.id)
      .eq('student_id', studentId)
      .maybeSingle();
    if (existingError) throw existingError;

    const query = existing?.id
      ? supabaseAdmin
          .from('activity_submissions')
          .update(payload)
          .eq('id', existing.id)
          .eq('student_id', studentId)
      : supabaseAdmin
          .from('activity_submissions')
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          });

    const { data, error } = await query
      .select('*, activities(title)')
      .single();

    if (error) throw error;
    return json({ submission: data });
  } catch (error) {
    return apiError(error);
  }
}
