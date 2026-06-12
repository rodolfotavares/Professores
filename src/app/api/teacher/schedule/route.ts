import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  student_id: z.string().uuid(),
  class_date: z.string(),
  class_time: z.string(),
  duration_minutes: z.number().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    const { data, error } = await supabaseAdmin
      .from('class_schedules')
      .select('*, students(full_name)')
      .eq('teacher_id', user.id)
      .order('class_date')
      .order('class_time');

    if (error) throw error;
    return json({ classes: data || [] });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    const body = schema.parse(await req.json());

    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('id', body.student_id)
      .eq('teacher_id', user.id)
      .single();
    if (studentError || !student) return json({ error: 'Aluno nao encontrado.' }, { status: 404 });

    const { data, error } = await supabaseAdmin
      .from('class_schedules')
      .insert({
        teacher_id: user.id,
        student_id: student.id,
        student_user_id: student.user_id,
        subject: student.subject,
        class_date: body.class_date,
        class_time: body.class_time,
        duration_minutes: body.duration_minutes || student.duration_minutes || 60,
      })
      .select('*, students(full_name)')
      .single();

    if (error) throw error;
    return json({ class: data });
  } catch (error) {
    return apiError(error);
  }
}
