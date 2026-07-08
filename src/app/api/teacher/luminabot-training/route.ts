import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const updateSchema = z.object({
  id: z.string().uuid(),
  intent: z.string().min(2).optional(),
  entities: z.record(z.unknown()).optional(),
  status: z.enum(['approved', 'pending_review', 'rejected', 'auto']).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissao.' }, { status: 403 });

    const { data, error } = await supabaseAdmin
      .from('luminabot_training_examples')
      .select('id, phrase, normalized_phrase, intent, entities, confidence, source, status, usage_count, created_at, updated_at')
      .eq('teacher_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(80);

    if (error) {
      if (error.code === '42P01') return json({ examples: [], table_ready: false });
      throw error;
    }

    return json({ examples: data || [], table_ready: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissao.' }, { status: 403 });

    const payload = updateSchema.parse(await req.json());
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (payload.intent) patch.intent = payload.intent;
    if (payload.entities) patch.entities = payload.entities;
    if (payload.status) patch.status = payload.status;

    const { data, error } = await supabaseAdmin
      .from('luminabot_training_examples')
      .update(patch)
      .eq('id', payload.id)
      .eq('teacher_id', user.id)
      .select('id, phrase, intent, entities, confidence, source, status, updated_at')
      .single();

    if (error) throw error;
    return json({ example: data });
  } catch (error) {
    return apiError(error);
  }
}
