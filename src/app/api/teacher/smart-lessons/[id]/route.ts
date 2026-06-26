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
  learning_progress: z.string().nullable().optional(),
  next_lesson_suggestion: z.string().nullable().optional(),
  guardian_message: z.string().nullable().optional(),
  teacher_signature: z.string().nullable().optional(),
  learning_score: z.number().nullable().optional(),
  detected_doubts: z.string().nullable().optional(),
  learning_evidence: z.string().nullable().optional(),
  raw_transcript: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'APPROVED', 'PUBLISHED', 'ARCHIVED']).optional(),
});

const reportSelect = '*, students(full_name, subject, guardian_whatsapp), class_schedules(class_date, class_time, subject, duration_minutes, actual_duration_minutes)';

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissao.' }, { status: 403 });

    const params = await context.params;
    const body = schema.parse(await req.json());
    const now = new Date().toISOString();
    const update: Record<string, unknown> = { ...body, updated_at: now };

    if (body.guardian_message && !body.parent_message) update.parent_message = body.guardian_message;
    if (body.status === 'APPROVED') update.reviewed_at = now;
    if (body.status === 'PUBLISHED') {
      update.reviewed_at = now;
      update.published_at = now;
    }

    const { data, error } = await supabaseAdmin
      .from('lesson_reports')
      .update(update)
      .eq('id', params.id)
      .eq('teacher_id', user.id)
      .select(reportSelect)
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
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissao.' }, { status: 403 });

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
