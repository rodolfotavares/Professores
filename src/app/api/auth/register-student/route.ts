import { NextRequest } from 'next/server';
import { z } from 'zod';
import { assertSupabaseAdminConfigured } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  whatsapp: z.string().optional(),
  access_code: z.string().min(4),
});

export async function POST(req: NextRequest) {
  try {
    assertSupabaseAdminConfigured();
    const body = schema.parse(await req.json());
    const code = body.access_code.toUpperCase().trim();

    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teacher_profiles')
      .select('user_id, access_code')
      .eq('access_code', code)
      .single();

    if (teacherError || !teacher) {
      return Response.json({ error: 'Codigo do professor invalido.' }, { status: 400 });
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
      whatsapp: body.whatsapp || null,
    });
    if (profileError) throw profileError;

    const { error: studentError } = await supabaseAdmin.from('students').insert({
      teacher_id: teacher.user_id,
      user_id: userId,
      full_name: body.full_name,
      email: body.email,
      whatsapp: body.whatsapp || null,
      status: 'active',
    });
    if (studentError) throw studentError;

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.';
    return Response.json({ error: message }, { status: 400 });
  }
}
