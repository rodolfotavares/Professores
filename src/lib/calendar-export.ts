import type { ClassSchedule } from '@/types';

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function toIcsDate(date: string, time: string) {
  const cleanTime = (time || '00:00').slice(0, 5).replace(':', '');
  return `${date.replace(/-/g, '')}T${cleanTime}00`;
}

function addMinutes(date: string, time: string, minutes: number) {
  const parsed = new Date(`${date}T${(time || '00:00').slice(0, 5)}:00`);
  parsed.setMinutes(parsed.getMinutes() + minutes);
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  const h = String(parsed.getHours()).padStart(2, '0');
  const min = String(parsed.getMinutes()).padStart(2, '0');
  return `${y}${m}${d}T${h}${min}00`;
}

export function downloadScheduleIcs(classes: ClassSchedule[], filename: string, ownerLabel: string) {
  const scheduled = classes.filter((item) => item.status === 'scheduled');
  const events = scheduled.map((item) => {
    const studentName = item.students?.full_name || 'Aluno';
    const subject = item.subject || 'Aula particular';
    const summary = `${subject} - ${studentName}`;
    const description = `Aula registrada no LuminaAI. Status: ${item.status}.`;
    return [
      'BEGIN:VEVENT',
      `UID:${item.id}@luminaai`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${toIcsDate(item.class_date, item.class_time)}`,
      `DTEND:${addMinutes(item.class_date, item.class_time, item.duration_minutes || 60)}`,
      `SUMMARY:${escapeIcs(summary)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcs(`Lembrete: ${summary}`)}`,
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n');
  });

  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LuminaAI//Agenda//PT-BR',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeIcs(`LuminaAI - ${ownerLabel}`)}`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([calendar], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function requestReminderPermission() {
  if (typeof Notification === 'undefined') {
    globalThis.alert?.('Este navegador nao suporta notificacoes locais.');
    return;
  }
  Notification.requestPermission().then((permission) => {
    window.localStorage.setItem('lumina-reminders-enabled', permission === 'granted' ? 'yes' : 'no');
    if (permission === 'granted') {
      new Notification('LuminaAI', { body: 'Lembretes ativados neste dispositivo.' });
    }
  });
}
