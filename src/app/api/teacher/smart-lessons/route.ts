import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { generateLessonReport } from '@/lib/lesson-report';
import { supabaseAdmin } from '@/lib/supabase-admin';

const generateSchema = z.object({
  lesson_id: z.string().uuid(),
  taught_content: z.string().optional(),
  observations: z.string().optional(),
  homework: z.string().optional(),
  raw_transcript: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissão.' }, { status: 403 });

    const status = req.nextUrl.searchParams.get('status');
    let query = supabaseAdmin
      .from('lesson_reports')
      .select('*, students(full_name, subject), class_schedules(class_date, class_time, subject, duration_minutes, actual_duration_minutes)')
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
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissão.' }, { status: 403 });

    const body = generateSchema.parse(await req.json());
    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('class_schedules')
      .select('*, students(full_name, subject)')
      .eq('id', body.lesson_id)
      .eq('teacher_id', user.id)
      .single();

    if (lessonError || !lesson) return json({ error: 'Aula não encontrada.' }, { status: 404 });

    const duration = lesson.actual_duration_minutes || lesson.duration_minutes || 60;
    const generated = generateLessonReport({
      professor: user.full_name || 'Professor',
      student: lesson.students?.full_name || 'Aluno',
      subject: lesson.subject || lesson.students?.subject || 'Aula',
      duration,
      taughtContent: body.taught_content || '',
      observations: body.observations || '',
      homework: body.homework || '',
      transcript: body.raw_transcript || '',
    });

    const payload = {
      lesson_id: lesson.id,
      teacher_id: user.id,
      student_id: lesson.student_id,
      student_user_id: lesson.student_user_id,
      ...generated,
      taught_content: generated.taught_content,
      homework: generated.homework,
      raw_transcript: body.raw_transcript || '',
      status: 'DRAFT',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('lesson_reports')
      .insert(payload)
      .select('*, students(full_name, subject), class_schedules(class_date, class_time, subject, duration_minutes, actual_duration_minutes)')
      .single();

    if (error) throw error;
    return json({ report: data });
  } catch (error) {
    return apiError(error);
  }
}
