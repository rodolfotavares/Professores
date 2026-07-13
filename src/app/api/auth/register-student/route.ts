import { NextRequest } from 'next/server';
import { z } from 'zod';
import { assertSupabaseAdminConfigured } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findValidStudentInvite, markInviteUsed, upsertTeacherStudentLink } from '@/lib/student-links';
import { isStrongPassword, isValidBrazilPhone, normalizeBrazilPhone, passwordRuleMessage } from '@/lib/validation';

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().refine(isStrongPassword, passwordRuleMessage),
  whatsapp: z.string().optional().refine(isValidBrazilPhone, 'Informe um WhatsApp brasileiro valido com DDD.'),
  access_code: z.string().optional(),
  invite_token: z.string().optional(),
});

function normalizeInviteToken(value?: string) {
  if (!value) return '';
  try {
    if (value.startsWith('http')) return new URL(value).searchParams.get('invite') || value;
  } catch {
    return value;
  }
  return value;
}

export async function POST(req: NextRequest) {
  try {
    assertSupabaseAdminConfigured();
    const body = schema.parse(await req.json());
    const whatsapp = body.whatsapp ? normalizeBrazilPhone(body.whatsapp) : null;
    const inviteToken = normalizeInviteToken(body.invite_token);
    const invite = inviteToken ? await findValidStudentInvite(inviteToken) : null;
    const code = body.access_code?.toUpperCase().trim() || '';

    if (!invite && !code) {
      return Response.json({ error: 'Informe o codigo do professor ou use um link de convite.' }, { status: 400 });
    }

    const teacherResult = invite
      ? await supabaseAdmin.from('teacher_profiles').select('user_id, access_code').eq('user_id', invite.teacher_id).single()
      : await supabaseAdmin.from('teacher_profiles').select('user_id, access_code').eq('access_code', code).single();

    const teacher = teacherResult.data;
    if (teacherResult.error || !teacher) {
      return Response.json({ error: 'Codigo ou convite do professor invalido.' }, { status: 400 });
    }

    if (invite?.email && invite.email.toLowerCase() !== body.email.toLowerCase()) {
      return Response.json({ error: 'Este convite foi gerado para outro e-mail.' }, { status: 400 });
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    });

    if (createError || !created.user) {
      return Response.json({ error: createError?.message || 'Erro ao criar usuario.' }, { status: 400 });
    }

    const userId = created.user.id;

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      role: 'student',
      full_name: body.full_name,
      whatsapp,
    });
    if (profileError) throw profileError;

    const { data: student, error: studentError } = await supabaseAdmin.from('students').insert({
      teacher_id: teacher.user_id,
      user_id: userId,
      full_name: body.full_name,
      email: body.email,
      whatsapp,
      subject: invite?.subject || null,
      price_per_class: invite?.price_per_class || 100,
      classes_per_week: invite?.classes_per_week || null,
      classes_per_month: invite?.classes_per_week ? invite.classes_per_week * 4 : null,
      status: 'active',
    }).select('*').single();
    if (studentError) throw studentError;

    await upsertTeacherStudentLink({
      teacherId: teacher.user_id,
      studentId: student.id,
      studentUserId: userId,
      subject: student.subject,
      pricePerClass: student.price_per_class,
      classesPerWeek: student.classes_per_week,
      inviteId: invite?.id || null,
    });

    if (invite?.id) await markInviteUsed(invite.id, student.id, userId);

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.';
    return Response.json({ error: message }, { status: 400 });
  }
}
