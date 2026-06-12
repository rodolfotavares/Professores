import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { parseDays } from '@/lib/codes';
import { makeUpcomingClassDates } from '@/lib/schedule';
import { supabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  whatsapp: z.string().optional(),
  subject: z.string().optional(),
  days_of_week: z.string().optional(),
  class_time: z.string().optional(),
  duration_minutes: z.number().optional(),
  classes_per_week: z.number().optional(),
  price_per_class: z.number().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissao.' }, { status: 403 });

    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('teacher_id', user.id)
      .order('full_name');

    if (error) throw error;
    return json({ students: data || [] });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissao.' }, { status: 403 });

    const body = schema.parse(await req.json());
    const daysOfWeek = parseDays(body.days_of_week || '');
    const classTime = body.class_time || null;
    const durationMinutes = body.duration_minutes || 60;

    const { data: student, error } = await supabaseAdmin
      .from('students')
      .insert({
        teacher_id: user.id,
        full_name: body.full_name,
        email: body.email,
        whatsapp: body.whatsapp || null,
        subject: body.subject || null,
        days_of_week: daysOfWeek,
        class_time: classTime,
        duration_minutes: durationMinutes,
        classes_per_week: body.classes_per_week || null,
        classes_per_month: body.classes_per_week ? body.classes_per_week * 4 : null,
        price_per_class: body.price_per_class || 100,
      })
      .select('*')
      .single();

    if (error) throw error;

    if (classTime && daysOfWeek.length > 0) {
      const classes = makeUpcomingClassDates(daysOfWeek).map((classDate) => ({
        teacher_id: user.id,
        student_id: student.id,
        student_user_id: student.user_id,
        subject: student.subject,
        class_date: classDate,
        class_time: classTime,
        duration_minutes: durationMinutes,
      }));

      const { error: scheduleError } = await supabaseAdmin.from('class_schedules').insert(classes);
      if (scheduleError) throw scheduleError;
    }

    return json({ student });
  } catch (error) {
    return apiError(error);
  }
}
