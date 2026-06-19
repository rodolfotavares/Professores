import { NextRequest } from 'next/server';
import { z } from 'zod';
import { assertSupabaseAdminConfigured } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isStrongPassword, isValidBrazilPhone, normalizeBrazilPhone, passwordRuleMessage } from '@/lib/validation';

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().refine(isStrongPassword, passwordRuleMessage),
  whatsapp: z.string().optional().refine(isValidBrazilPhone, 'Informe um WhatsApp brasileiro valido com DDD.'),
  access_code: z.string().min(4),
});

export async function POST(req: NextRequest) {
  try {
    assertSupabaseAdminConfigured();
    const body = schema.parse(await req.json());
    const code = body.access_code.toUpperCase().trim();
    const whatsapp = body.whatsapp ? normalizeBrazilPhone(body.whatsapp) : null;

    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teacher_profiles')
      .select('user_id, access_code')
      .eq('access_code', code)
      .single();

    if (teacherError || !teacher) {
      return Response.json({ error: 'Código do professor inválido.' }, { status: 400 });
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    });

    if (createError || !created.user) {
      return Response.json({ error: createError?.message || 'Erro ao criar usuário.' }, { status: 400 });
    }

    const userId = created.user.id;

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      role: 'student',
      full_name: body.full_name,
      whatsapp,
    });
    if (profileError) throw profileError;

    const { error: studentError } = await supabaseAdmin.from('students').insert({
      teacher_id: teacher.user_id,
      user_id: userId,
      full_name: body.full_name,
      email: body.email,
      whatsapp,
      status: 'active',
    });
    if (studentError) throw studentError;

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.';
    return Response.json({ error: message }, { status: 400 });
  }
}
