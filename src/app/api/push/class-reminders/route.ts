import { NextRequest } from 'next/server';
import { apiError, json } from '@/lib/api-auth';
import { isPushConfigured, sendPushToUser } from '@/lib/push';
import { supabaseAdmin } from '@/lib/supabase-admin';

type ClassReminder = {
  id: string;
  teacher_id: string;
  student_user_id: string | null;
  subject: string | null;
  class_date: string;
  class_time: string;
  status: string;
  students?: { full_name: string | null } | Array<{ full_name: string | null }> | null;
};

function classStartsAt(item: ClassReminder) {
  return new Date(`${item.class_date}T${item.class_time}`);
}

function minutesUntil(date: Date) {
  return Math.round((date.getTime() - Date.now()) / 60000);
}

function studentNameOf(item: ClassReminder) {
  const student = Array.isArray(item.students) ? item.students[0] : item.students;
  return student?.full_name || 'aluno';
}

async function handleClassReminders(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization') || '';
    if (!cronSecret) {
      return json({ error: 'CRON_SECRET nao configurado.' }, { status: 503 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return json({ error: 'Nao autorizado.' }, { status: 401 });
    }

    if (!isPushConfigured()) {
      return json({ sent: 0, skipped: true, reason: 'Push nao configurado.' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabaseAdmin
      .from('class_schedules')
      .select('id, teacher_id, student_user_id, subject, class_date, class_time, status, students(full_name)')
      .eq('class_date', today)
      .eq('status', 'scheduled');

    if (error) throw error;

    const reminders = (data || []) as unknown as ClassReminder[];
    const upcoming = reminders.filter((item) => {
      const minutes = minutesUntil(classStartsAt(item));
      return minutes >= 0 && minutes <= 30;
    });

    let sent = 0;
    for (const item of upcoming) {
      const subject = item.subject || 'aula';
      const studentName = studentNameOf(item);
      const start = classStartsAt(item).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const teacherResult = await sendPushToUser(item.teacher_id, {
        title: 'Aula em breve',
        body: `${studentName} tem ${subject} as ${start}.`,
        url: '/teacher',
      }).catch(() => ({ sent: 0 }));
      sent += teacherResult.sent;

      if (item.student_user_id) {
        const studentResult = await sendPushToUser(item.student_user_id, {
          title: 'Sua aula esta chegando',
          body: `${subject} começa as ${start}.`,
          url: '/student',
        }).catch(() => ({ sent: 0 }));
        sent += studentResult.sent;
      }
    }

    return json({ sent, checked: data?.length || 0, upcoming: upcoming.length });
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(req: NextRequest) {
  return handleClassReminders(req);
}

export async function POST(req: NextRequest) {
  return handleClassReminders(req);
}
