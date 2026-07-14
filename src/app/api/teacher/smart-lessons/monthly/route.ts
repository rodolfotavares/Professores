import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { generateMonthlyStudentReport } from '@/lib/lesson-report';
import { supabaseAdmin } from '@/lib/supabase-admin';

const monthlySchema = z.object({
  student_id: z.string().uuid(),
  month_reference: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  teacher_guidance: z.string().optional(),
});

function nextMonth(month: string) {
  const [year, value] = month.split('-').map(Number);
  const next = new Date(Date.UTC(year, value, 1, 12));
  return next.toISOString().slice(0, 7);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissao.' }, { status: 403 });

    const body = monthlySchema.parse(await req.json());
    const month = body.month_reference || new Date().toISOString().slice(0, 7);

    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, full_name, subject')
      .eq('id', body.student_id)
      .eq('teacher_id', user.id)
      .single();

    if (studentError || !student) return json({ error: 'Aluno nao encontrado.' }, { status: 404 });

    const { data: reports, error: reportsError } = await supabaseAdmin
      .from('lesson_reports')
      .select('title, summary, taught_content, reinforcement_points, homework, next_recommendation, learning_progress, next_lesson_suggestion, detected_doubts, learning_score, learning_evidence, created_at, published_at, class_schedules(class_date, class_time, subject)')
      .eq('teacher_id', user.id)
      .eq('student_id', body.student_id)
      .eq('status', 'PUBLISHED')
      .gte('published_at', `${month}-01T00:00:00.000Z`)
      .lt('published_at', `${nextMonth(month)}-01T00:00:00.000Z`)
      .order('published_at', { ascending: true });

    if (reportsError) throw reportsError;
    if (!reports?.length) {
      return json({ error: 'Ainda nao ha relatorios publicados para esse aluno no mes selecionado.' }, { status: 400 });
    }

    const monthlyReport = generateMonthlyStudentReport({
      student: student.full_name,
      subject: student.subject,
      period: month,
      reports: (reports || []).map((item: any) => ({
        ...item,
        class_schedules: Array.isArray(item.class_schedules) ? item.class_schedules[0] : item.class_schedules,
      })),
      teacherGuidance: body.teacher_guidance || '',
    });

    return json({ monthlyReport });
  } catch (error) {
    return apiError(error);
  }
}
