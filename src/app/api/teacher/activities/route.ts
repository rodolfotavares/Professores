import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  subject: z.string().optional(),
  student_id: z.string().uuid().optional(),
  due_date: z.string().optional(),
  points: z.number().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    const { data, error } = await supabaseAdmin
      .from('activities')
      .select('*, students(full_name)')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return json({ activities: data || [] });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    const body = schema.parse(await req.json());

    let studentUserId = null;
    if (body.student_id) {
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .select('id, user_id')
        .eq('id', body.student_id)
        .eq('teacher_id', user.id)
        .single();
      if (studentError || !student) return json({ error: 'Aluno nao encontrado.' }, { status: 404 });
      studentUserId = student.user_id;
    }

    const { data, error } = await supabaseAdmin
      .from('activities')
      .insert({
        teacher_id: user.id,
        student_id: body.student_id || null,
        student_user_id: studentUserId,
        title: body.title,
        description: body.description,
        subject: body.subject || null,
        due_date: body.due_date || null,
        points: body.points || 10,
      })
      .select('*, students(full_name)')
      .single();

    if (error) throw error;
    return json({ activity: data });
  } catch (error) {
    return apiError(error);
  }
}
