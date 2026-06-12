import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { parseDays } from '@/lib/codes';
import { makeUpcomingClassDates } from '@/lib/schedule';
import { supabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  full_name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  whatsapp: z.string().optional(),
  subject: z.string().optional(),
  days_of_week: z.string().optional(),
  class_time: z.string().optional(),
  duration_minutes: z.number().optional(),
  classes_per_week: z.number().optional(),
  price_per_class: z.number().optional(),
  status: z.enum(['active', 'paused', 'inactive']).optional(),
  regenerate_schedule: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissao.' }, { status: 403 });

    const params = await context.params;
    const body = schema.parse(await req.json());
    const daysOfWeek = body.days_of_week !== undefined ? parseDays(body.days_of_week) : undefined;

    const update: Record<string, unknown> = {};
    if (body.full_name !== undefined) update.full_name = body.full_name;
    if (body.email !== undefined) update.email = body.email;
    if (body.whatsapp !== undefined) update.whatsapp = body.whatsapp || null;
    if (body.subject !== undefined) update.subject = body.subject || null;
    if (daysOfWeek !== undefined) update.days_of_week = daysOfWeek;
    if (body.class_time !== undefined) update.class_time = body.class_time || null;
    if (body.duration_minutes !== undefined) update.duration_minutes = body.duration_minutes;
    if (body.classes_per_week !== undefined) {
      update.classes_per_week = body.classes_per_week;
      update.classes_per_month = body.classes_per_week * 4;
    }
    if (body.price_per_class !== undefined) update.price_per_class = body.price_per_class;
    if (body.status !== undefined) update.status = body.status;
    update.updated_at = new Date().toISOString();

    const { data: student, error } = await supabaseAdmin
      .from('students')
      .update(update)
      .eq('id', params.id)
      .eq('teacher_id', user.id)
      .select('*')
      .single();

    if (error) throw error;

    if (body.regenerate_schedule) {
      await supabaseAdmin
        .from('class_schedules')
        .delete()
        .eq('student_id', student.id)
        .eq('teacher_id', user.id)
        .eq('status', 'scheduled');

      if (student.class_time && student.days_of_week?.length) {
        const classes = makeUpcomingClassDates(student.days_of_week).map((classDate) => ({
          teacher_id: user.id,
          student_id: student.id,
          student_user_id: student.user_id,
          subject: student.subject,
          class_date: classDate,
          class_time: student.class_time,
          duration_minutes: student.duration_minutes || 60,
        }));

        const { error: scheduleError } = await supabaseAdmin.from('class_schedules').insert(classes);
        if (scheduleError) throw scheduleError;
      }
    }

    return json({ student });
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
      .from('students')
      .delete()
      .eq('id', params.id)
      .eq('teacher_id', user.id);

    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
