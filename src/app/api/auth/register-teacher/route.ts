import { NextRequest } from 'next/server';
import { z } from 'zod';
import { makeTeacherCode } from '@/lib/codes';
import { assertSupabaseAdminConfigured } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isStrongPassword, isValidBrazilPhone, normalizeBrazilPhone, passwordRuleMessage } from '@/lib/validation';
import { currentSubscriptionMonth } from '@/lib/api-auth';

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().refine(isStrongPassword, passwordRuleMessage),
  whatsapp: z.string().optional().refine(isValidBrazilPhone, 'Informe um WhatsApp brasileiro valido com DDD.'),
  subjects: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    assertSupabaseAdminConfigured();
    const body = schema.parse(await req.json());
    const whatsapp = body.whatsapp ? normalizeBrazilPhone(body.whatsapp) : null;

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    });

    if (createError || !created.user) {
      return Response.json({ error: createError?.message || 'Erro ao criar usuário.' }, { status: 400 });
    }

    const userId = created.user.id;
    const accessCode = makeTeacherCode();

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      role: 'teacher',
      full_name: body.full_name,
      whatsapp,
    });

    if (profileError) throw profileError;

    const { error: teacherError } = await supabaseAdmin.from('teacher_profiles').insert({
      user_id: userId,
      access_code: accessCode,
      subjects: body.subjects || '',
    });

    if (teacherError) throw teacherError;

    const { error: subscriptionError } = await supabaseAdmin.from('app_subscriptions').insert({
      teacher_id: userId,
      month_reference: currentSubscriptionMonth(),
      amount: 39.9,
      status: 'pending',
    });

    if (subscriptionError) throw subscriptionError;

    return Response.json({ ok: true, access_code: accessCode });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.';
    return Response.json({ error: message }, { status: 400 });
  }
}
