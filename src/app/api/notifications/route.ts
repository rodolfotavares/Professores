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
      const [{ data: classes }, { data: submissions }, { data: messages }] = await Promise.all([
        supabaseAdmin.from('class_schedules').select('id, class_date, class_time, subject, students(full_name)').eq('teacher_id', user.id).eq('status', 'scheduled').order('class_date').order('class_time').limit(20),
        supabaseAdmin.from('activity_submissions').select('id, activities(title), students(full_name)').eq('teacher_id', user.id).eq('status', 'submitted').limit(20),
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

      (submissions || []).forEach((item: any) => {
        notifications.push({
          id: `submission-${item.id}`,
          title: 'Atividade para corrigir',
          message: `${item.students?.full_name || 'Aluno'} enviou ${item.activities?.title || 'uma atividade'}.`,
          type: 'activity',
          link: '/teacher/activities',
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
        const [{ data: classes }, { data: activities }, { data: submissions }, { data: messages }] = await Promise.all([
          supabaseAdmin.from('class_schedules').select('id, class_date, class_time, subject').eq('student_id', student.id).eq('status', 'scheduled').order('class_date').order('class_time').limit(20),
          supabaseAdmin.from('activities').select('id, title, due_date').or(`student_id.eq.${student.id},student_id.is.null`).eq('visible_to_student', true).limit(30),
          supabaseAdmin.from('activity_submissions').select('activity_id').eq('student_id', student.id),
          supabaseAdmin.from('messages').select('id, text').eq('student_id', student.id).eq('sender_role', 'teacher').eq('is_read', false).limit(10),
        ]);
        const submittedIds = new Set((submissions || []).map((item: any) => item.activity_id));

        (classes || []).filter((item: any) => isWithinHours(item.class_date, item.class_time, 24)).forEach((item: any) => {
          notifications.push({
            id: `class-${item.id}`,
            title: 'Aula nas proximas 24h',
            message: `${item.subject || 'Aula'} as ${String(item.class_time).slice(0, 5)}`,
            type: 'schedule',
            link: '/student/schedule',
          });
        });

        (activities || []).filter((item: any) => item.due_date && !submittedIds.has(item.id) && isWithinHours(item.due_date, '23:59', 72)).forEach((item: any) => {
          notifications.push({
            id: `activity-${item.id}`,
            title: 'Atividade perto do prazo',
            message: `${item.title} vence em ${item.due_date}.`,
            type: 'activity',
            link: '/student/activities',
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
