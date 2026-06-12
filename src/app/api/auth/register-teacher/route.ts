import { NextRequest } from 'next/server';
import { z } from 'zod';
import { makeTeacherCode } from '@/lib/codes';
import { assertSupabaseAdminConfigured } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  whatsapp: z.string().optional(),
  subjects: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    assertSupabaseAdminConfigured();
    const body = schema.parse(await req.json());

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    });

    if (createError || !created.user) {
      return Response.json({ error: createError?.message || 'Erro ao criar usuario.' }, { status: 400 });
    }

    const userId = created.user.id;
    const accessCode = makeTeacherCode();

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      role: 'teacher',
      full_name: body.full_name,
      whatsapp: body.whatsapp || null,
    });

    if (profileError) throw profileError;

    const { error: teacherError } = await supabaseAdmin.from('teacher_profiles').insert({
      user_id: userId,
      access_code: accessCode,
      subjects: body.subjects || '',
    });

    if (teacherError) throw teacherError;

    return Response.json({ ok: true, access_code: accessCode });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.';
    return Response.json({ error: message }, { status: 400 });
  }
}
