import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { isPushConfigured, sendPushToUser } from '@/lib/push';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { studentIdsForUser } from '@/lib/student-links';

const schema = z.object({
  student_id: z.string().uuid(),
  text: z.string().optional(),
  attachment_url: z.string().url().optional(),
  attachment_name: z.string().optional(),
  attachment_type: z.string().optional(),
}).refine((value) => Boolean(value.text?.trim() || value.attachment_url), {
  message: 'Envie uma mensagem ou um anexo.',
});

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    const url = new URL(req.url);
    const studentId = url.searchParams.get('student_id');

    if (user.role === 'teacher' || user.role === 'admin') {
      let query = supabaseAdmin.from('messages').select('*').eq('teacher_id', user.id).order('created_at');
      if (studentId) query = query.eq('student_id', studentId);
      const { data, error } = await query;
      if (error) throw error;
      return json({ messages: data || [] });
    }

    const studentIds = await studentIdsForUser(user.id);
    if (!studentIds.length) return json({ messages: [] });

    if (studentId && !studentIds.includes(studentId)) {
      return json({ error: 'Sem permissao.' }, { status: 403 });
    }

    let query = supabaseAdmin.from('messages').select('*').in('student_id', studentIds).order('created_at');
    if (studentId) query = query.eq('student_id', studentId);

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
    if (studentError || !student) return json({ error: 'Aluno não encontrado.' }, { status: 404 });

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
        text: body.text?.trim() || '',
        attachment_url: body.attachment_url || null,
        attachment_name: body.attachment_name || null,
        attachment_type: body.attachment_type || null,
      })
      .select('*')
      .single();

    if (error) throw error;

    const recipientId = isStudent ? student.teacher_id : student.user_id;
    if (recipientId && isPushConfigured()) {
      await sendPushToUser(recipientId, {
        title: 'Nova mensagem no LuminaAI',
        body: body.text?.trim() || 'Voce recebeu um novo anexo.',
        url: isStudent ? '/teacher/messages' : '/student/messages',
      }).catch(() => undefined);
    }

    return json({ message: data });
  } catch (error) {
    return apiError(error);
  }
}
