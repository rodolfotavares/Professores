import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  class_date: z.string().optional(),
  class_time: z.string().optional(),
  duration_minutes: z.number().optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'absence']).optional(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissao.' }, { status: 403 });

    const params = await context.params;
    const body = schema.parse(await req.json());
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.class_date !== undefined) update.class_date = body.class_date;
    if (body.class_time !== undefined) update.class_time = body.class_time;
    if (body.duration_minutes !== undefined) update.duration_minutes = body.duration_minutes;
    if (body.status !== undefined) update.status = body.status;

    const { data, error } = await supabaseAdmin
      .from('class_schedules')
      .update(update)
      .eq('id', params.id)
      .eq('teacher_id', user.id)
      .select('*, students(full_name)')
      .single();

    if (error) throw error;
    return json({ class: data });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissao.' }, { status: 403 });

    const params = await context.params;
    const { error } = await supabaseAdmin
      .from('class_schedules')
      .delete()
      .eq('id', params.id)
      .eq('teacher_id', user.id);

    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
