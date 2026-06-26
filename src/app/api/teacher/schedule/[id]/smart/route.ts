import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  action: z.enum(['start', 'finish']),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissão.' }, { status: 403 });

    const params = await context.params;
    const body = schema.parse(await req.json());

    const { data: current, error: currentError } = await supabaseAdmin
      .from('class_schedules')
      .select('*')
      .eq('id', params.id)
      .eq('teacher_id', user.id)
      .single();

    if (currentError || !current) return json({ error: 'Aula não encontrada.' }, { status: 404 });

    const now = new Date();
    const update: Record<string, unknown> = {
      updated_at: now.toISOString(),
      teacher_present: true,
    };

    if (body.action === 'start') {
      update.started_at = current.started_at || now.toISOString();
      update.smart_status = 'in_progress';
    } else {
      const started = current.started_at ? new Date(current.started_at) : now;
      update.started_at = current.started_at || now.toISOString();
      update.finished_at = now.toISOString();
      update.actual_duration_minutes = Math.max(1, Math.round((now.getTime() - started.getTime()) / 60000));
      update.smart_status = 'completed';
      update.status = 'completed';
    }

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
