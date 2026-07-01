import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

function toDateTime(date: string, time: string) {
  return new Date(`${date}T${(time || '00:00').slice(0, 5)}:00`);
}

function isWithinHours(date: string, time: string, hours: number) {
  const now = new Date();
  const target = toDateTime(date, time);
  const diff = target.getTime() - now.getTime();
  return diff >= 0 && diff <= hours * 60 * 60 * 1000;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    const notifications: Array<{ id: string; title: string; message: string; type: string; link: string }> = [];

    if (user.role === 'teacher' || user.role === 'admin') {
      const [{ data: classes }, { data: messages }] = await Promise.all([
        supabaseAdmin.from('class_schedules').select('id, class_date, class_time, subject, students(full_name)').eq('teacher_id', user.id).eq('status', 'scheduled').order('class_date').order('class_time').limit(20),
        supabaseAdmin.from('messages').select('id, text, students(full_name)').eq('teacher_id', user.id).eq('sender_role', 'student').eq('is_read', false).limit(10),
      ]);

      (classes || []).filter((item: any) => isWithinHours(item.class_date, item.class_time, 24)).forEach((item: any) => {
        notifications.push({
          id: `class-${item.id}`,
          title: 'Aula nas proximas 24h',
          message: `${item.students?.full_name || 'Aluno'} - ${item.subject || 'aula'} as ${String(item.class_time).slice(0, 5)}`,
          type: 'schedule',
          link: '/teacher/schedule',
        });
      });

      (messages || []).forEach((item: any) => {
        notifications.push({
          id: `message-${item.id}`,
          title: 'Mensagem de aluno',
          message: `${item.students?.full_name || 'Aluno'} enviou um recado.`,
          type: 'message',
          link: '/teacher/messages',
        });
      });
    } else {
      const { data: student } = await supabaseAdmin.from('students').select('id').eq('user_id', user.id).single();
      if (student?.id) {
        const [{ data: classes }, { data: messages }] = await Promise.all([
          supabaseAdmin.from('class_schedules').select('id, class_date, class_time, subject').eq('student_id', student.id).eq('status', 'scheduled').order('class_date').order('class_time').limit(20),
          supabaseAdmin.from('messages').select('id, text').eq('student_id', student.id).eq('sender_role', 'teacher').eq('is_read', false).limit(10),
        ]);

        (classes || []).filter((item: any) => isWithinHours(item.class_date, item.class_time, 24)).forEach((item: any) => {
          notifications.push({
            id: `class-${item.id}`,
            title: 'Aula nas proximas 24h',
            message: `${item.subject || 'Aula'} as ${String(item.class_time).slice(0, 5)}`,
            type: 'schedule',
            link: '/student',
          });
        });

        (messages || []).forEach((item: any) => {
          notifications.push({
            id: `message-${item.id}`,
            title: 'Mensagem do professor',
            message: 'Voce recebeu um novo recado.',
            type: 'message',
            link: '/student/messages',
          });
        });
      }
    }

    return json({ notifications });
  } catch (error) {
    return apiError(error);
  }
}
