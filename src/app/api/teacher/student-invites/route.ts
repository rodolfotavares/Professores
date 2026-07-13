import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { newInviteToken, hashInviteToken } from '@/lib/student-links';
import { supabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  student_id: z.string().uuid().optional(),
  email: z.string().email().optional(),
  subject: z.string().optional(),
  price_per_class: z.number().optional(),
  classes_per_week: z.number().optional(),
});

function appOrigin(req: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissao.' }, { status: 403 });

    const { data, error } = await supabaseAdmin
      .from('student_invites')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;
    return json({ invites: data || [] });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissao.' }, { status: 403 });

    const body = schema.parse(await req.json());
    let student: any = null;
    if (body.student_id) {
      const result = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('id', body.student_id)
        .eq('teacher_id', user.id)
        .maybeSingle();
      if (result.error) throw result.error;
      student = result.data;
      if (!student) return json({ error: 'Aluno nao encontrado.' }, { status: 404 });
    }

    const token = newInviteToken();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabaseAdmin
      .from('student_invites')
      .insert({
        teacher_id: user.id,
        student_id: student?.id || null,
        email: body.email || student?.email || null,
        subject: body.subject || student?.subject || null,
        price_per_class: body.price_per_class ?? student?.price_per_class ?? null,
        classes_per_week: body.classes_per_week ?? student?.classes_per_week ?? null,
        token_hash: hashInviteToken(token),
        expires_at: expiresAt,
      })
      .select('*')
      .single();

    if (error) throw error;
    const inviteUrl = `${appOrigin(req)}/register/student?invite=${encodeURIComponent(token)}`;
    return json({ invite: data, invite_url: inviteUrl, expires_at: expiresAt });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissao.' }, { status: 403 });
    const body = z.object({ id: z.string().uuid(), status: z.literal('cancelled') }).parse(await req.json());

    const { error } = await supabaseAdmin
      .from('student_invites')
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq('id', body.id)
      .eq('teacher_id', user.id);

    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
