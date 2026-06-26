import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  title: z.string().optional(),
  summary: z.string().nullable().optional(),
  taught_content: z.string().nullable().optional(),
  student_questions: z.string().nullable().optional(),
  reinforcement_points: z.string().nullable().optional(),
  exercises_done: z.string().nullable().optional(),
  homework: z.string().nullable().optional(),
  next_recommendation: z.string().nullable().optional(),
  parent_message: z.string().nullable().optional(),
  raw_transcript: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'APPROVED', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissão.' }, { status: 403 });

    const params = await context.params;
    const body = schema.parse(await req.json());
    const update: Record<string, unknown> = { ...body, updated_at: new Date().toISOString() };
    if (body.status === 'PUBLISHED') update.published_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('lesson_reports')
      .update(update)
      .eq('id', params.id)
      .eq('teacher_id', user.id)
      .select('*, students(full_name, subject), class_schedules(class_date, class_time, subject, duration_minutes, actual_duration_minutes)')
      .single();

    if (error) throw error;
    return json({ report: data });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissão.' }, { status: 403 });

    const params = await context.params;
    const { error } = await supabaseAdmin
      .from('lesson_reports')
      .delete()
      .eq('id', params.id)
      .eq('teacher_id', user.id);

    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
