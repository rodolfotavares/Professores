import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  student_id: z.string().uuid(),
  text: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    const url = new URL(req.url);
    const studentId = url.searchParams.get('student_id');

    let query = supabaseAdmin.from('messages').select('*').order('created_at');
    if (studentId) query = query.eq('student_id', studentId);

    if (user.role === 'teacher' || user.role === 'admin') {
      query = query.eq('teacher_id', user.id);
    } else {
      const { data: student } = await supabaseAdmin.from('students').select('id').eq('user_id', user.id).single();
      query = query.eq('student_id', student?.id || '00000000-0000-0000-0000-000000000000');
    }

    const { data, error } = await query;
    if (error) throw error;
    return json({ messages: data || [] });
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
      .single();
    if (studentError || !student) return json({ error: 'Aluno nao encontrado.' }, { status: 404 });

    const isTeacher = student.teacher_id === user.id;
    const isStudent = student.user_id === user.id;
    if (!isTeacher && !isStudent) return json({ error: 'Sem permissao.' }, { status: 403 });

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        teacher_id: student.teacher_id,
        student_id: student.id,
        sender_id: user.id,
        sender_role: isStudent ? 'student' : 'teacher',
        text: body.text,
      })
      .select('*')
      .single();

    if (error) throw error;
    return json({ message: data });
  } catch (error) {
    return apiError(error);
  }
}
