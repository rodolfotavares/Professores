import { supabaseAdmin } from './supabase-admin';

const meetingBaseUrl = 'https://meet.jit.si';

function safeRoomId(classScheduleId: string) {
  return `luminaai-aula-${classScheduleId.replace(/[^a-zA-Z0-9-]/g, '')}`;
}

export function classMeetingUrl(classScheduleId: string) {
  return `${meetingBaseUrl}/${safeRoomId(classScheduleId)}`;
}

function googleDateTime(classDate: string, classTime: string, durationMinutes: number) {
  const [hours, minutes] = classTime.slice(0, 5).split(':').map(Number);
  const start = new Date(`${classDate}T00:00:00`);
  start.setHours(hours || 0, minutes || 0, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + durationMinutes);

  const format = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}${mm}${dd}T${hh}${min}00`;
  };

  return `${format(start)}/${format(end)}`;
}

export function googleCalendarTemplateUrl(item: {
  id: string;
  class_date: string;
  class_time: string;
  duration_minutes?: number | null;
  subject?: string | null;
  meeting_url?: string | null;
  students?: { full_name?: string | null } | null;
}) {
  const meetingUrl = item.meeting_url || classMeetingUrl(item.id);
  const studentName = item.students?.full_name || 'Aluno';
  const title = `Aula - ${studentName}`;
  const details = [
    'Aula cadastrada no LuminaAI.',
    item.subject ? `Materia: ${item.subject}` : null,
    `Link da aula: ${meetingUrl}`,
  ].filter(Boolean).join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: googleDateTime(item.class_date, item.class_time, item.duration_minutes || 60),
    details,
    location: meetingUrl,
    ctz: 'America/Sao_Paulo',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export async function ensureClassMeetingLink(teacherId: string, classScheduleId: string) {
  const meetingUrl = classMeetingUrl(classScheduleId);
  const { data, error } = await supabaseAdmin
    .from('class_schedules')
    .update({
      meeting_provider: 'lumina_online',
      meeting_url: meetingUrl,
      meeting_start_url: meetingUrl,
      external_meeting_id: safeRoomId(classScheduleId),
      updated_at: new Date().toISOString(),
    })
    .eq('teacher_id', teacherId)
    .eq('id', classScheduleId)
    .select('*, students(full_name)')
    .single();

  if (error) throw error;
  return data;
}

export async function ensureFutureClassMeetingLinks(teacherId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: classes, error } = await supabaseAdmin
    .from('class_schedules')
    .select('id, meeting_url')
    .eq('teacher_id', teacherId)
    .eq('status', 'scheduled')
    .gte('class_date', today);

  if (error) throw error;

  let synced = 0;
  let meetLinks = 0;

  for (const item of classes || []) {
    if (!item.meeting_url) {
      await ensureClassMeetingLink(teacherId, item.id);
      synced += 1;
    }
    meetLinks += 1;
  }

  return { synced, meetLinks };
}
