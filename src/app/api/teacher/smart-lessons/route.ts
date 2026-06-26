import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { generateLessonReport } from '@/lib/lesson-report';
import { supabaseAdmin } from '@/lib/supabase-admin';

const generateSchema = z.object({
  lesson_id: z.string().uuid(),
  taught_content: z.string().optional(),
  class_notes: z.string().optional(),
  observations: z.string().optional(),
  homework: z.string().optional(),
  raw_transcript: z.string().optional(),
});

const reportSelect = '*, students(full_name, subject, guardian_whatsapp), class_schedules(class_date, class_time, subject, duration_minutes, actual_duration_minutes)';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissao.' }, { status: 403 });

    const status = req.nextUrl.searchParams.get('status');
    let query = supabaseAdmin
      .from('lesson_reports')
      .select(reportSelect)
      .eq('teacher_id', user.id)
      .order('updated_at', { ascending: false });

    if (status && status !== 'ALL') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return json({ reports: data || [] });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissao.' }, { status: 403 });

    const body = generateSchema.parse(await req.json());
    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('class_schedules')
      .select('*, students(full_name, subject)')
      .eq('id', body.lesson_id)
      .eq('teacher_id', user.id)
      .single();

    if (lessonError || !lesson) return json({ error: 'Aula nao encontrada.' }, { status: 404 });

    const duration = lesson.actual_duration_minutes || lesson.duration_minutes || 60;
    const subject = lesson.subject || lesson.students?.subject || 'Aula';
    const classNotes = body.class_notes || body.observations || body.raw_transcript || '';

    const { data: history, error: historyError } = await supabaseAdmin
      .from('lesson_reports')
      .select('summary, reinforcement_points, homework, next_recommendation, learning_progress, next_lesson_suggestion, published_at, class_schedules!inner(subject)')
      .eq('student_id', lesson.student_id)
      .eq('teacher_id', user.id)
      .eq('status', 'PUBLISHED')
      .eq('class_schedules.subject', subject)
      .order('published_at', { ascending: false })
      .limit(5);

    if (historyError) throw historyError;

    const generated = generateLessonReport({
      professor: user.full_name || 'Professor',
      student: lesson.students?.full_name || 'Aluno',
      subject,
      duration,
      taughtContent: body.taught_content || '',
      classNotes,
      homework: body.homework || '',
      history: history || [],
    });

    const payload = {
      lesson_id: lesson.id,
      teacher_id: user.id,
      student_id: lesson.student_id,
      student_user_id: lesson.student_user_id,
      ...generated,
      parent_message: generated.guardian_message,
      raw_transcript: classNotes,
      status: 'DRAFT',
      teacher_signature: `Relatorio revisado por ${user.full_name || 'Professor'} - ${subject}`,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('lesson_reports')
      .insert(payload)
      .select(reportSelect)
      .single();

    if (error) throw error;
    return json({ report: data });
  } catch (error) {
    return apiError(error);
  }
}
