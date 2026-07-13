import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { findValidStudentInvite, markInviteUsed, upsertTeacherStudentLink } from '@/lib/student-links';
import { supabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  invite_token: z.string().min(10),
});

function normalizeInviteToken(value: string) {
  try {
    if (value.startsWith('http')) return new URL(value).searchParams.get('invite') || value;
  } catch {
    return value;
  }
  return value;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'student') return json({ error: 'Apenas alunos podem aceitar convites.' }, { status: 403 });

    const body = schema.parse(await req.json());
    const invite = await findValidStudentInvite(normalizeInviteToken(body.invite_token.trim()));
    if (!invite) return json({ error: 'Convite invalido ou expirado.' }, { status: 400 });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, whatsapp')
      .eq('id', user.id)
      .single();
    if (profileError) throw profileError;

    const existingResult = invite.student_id
      ? await supabaseAdmin
        .from('students')
        .select('*')
        .eq('id', invite.student_id)
        .eq('teacher_id', invite.teacher_id)
        .maybeSingle()
      : await supabaseAdmin
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .eq('teacher_id', invite.teacher_id)
        .maybeSingle();
    if (existingResult.error) throw existingResult.error;

    let student = existingResult.data;
    if (!student) {
      const { data: created, error: createError } = await supabaseAdmin
        .from('students')
        .insert({
          teacher_id: invite.teacher_id,
          user_id: user.id,
          full_name: profile.full_name,
          email: user.email || invite.email || '',
          whatsapp: profile.whatsapp || null,
          subject: invite.subject || null,
          price_per_class: invite.price_per_class || 100,
          classes_per_week: invite.classes_per_week || null,
          classes_per_month: invite.classes_per_week ? invite.classes_per_week * 4 : null,
          status: 'active',
        })
        .select('*')
        .single();
      if (createError) throw createError;
      student = created;
    } else {
      const classesPerWeek = student.classes_per_week || invite.classes_per_week || null;
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('students')
        .update({
          user_id: user.id,
          full_name: profile.full_name || student.full_name,
          email: user.email || student.email || invite.email || '',
          whatsapp: profile.whatsapp || student.whatsapp || null,
          subject: student.subject || invite.subject || null,
          price_per_class: student.price_per_class || invite.price_per_class || 100,
          classes_per_week: classesPerWeek,
          classes_per_month: classesPerWeek ? classesPerWeek * 4 : null,
          status: student.status || 'active',
        })
        .eq('id', student.id)
        .select('*')
        .single();
      if (updateError) throw updateError;
      student = updated;
    }

    await upsertTeacherStudentLink({
      teacherId: invite.teacher_id,
      studentId: student.id,
      studentUserId: user.id,
      subject: student.subject || invite.subject,
      pricePerClass: student.price_per_class || invite.price_per_class,
      classesPerWeek: student.classes_per_week || invite.classes_per_week,
      inviteId: invite.id,
    });
    await markInviteUsed(invite.id, student.id, user.id);

    return json({ ok: true, student });
  } catch (error) {
    return apiError(error);
  }
}
