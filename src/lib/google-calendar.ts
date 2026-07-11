import { randomBytes } from 'crypto';
import { supabaseAdmin } from './supabase-admin';

const authBase = 'https://accounts.google.com/o/oauth2/v2/auth';
const tokenUrl = 'https://oauth2.googleapis.com/token';
const calendarBase = 'https://www.googleapis.com/calendar/v3';
const gmailBase = 'https://gmail.googleapis.com/gmail/v1';
const userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
const scopes = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
];

function cleanEnv(value?: string) {
  return (value || '').normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

export function googleRedirectUri(origin: string) {
  return `${origin}/api/google/calendar/callback`;
}

export function getGoogleCredentials() {
  const clientId = cleanEnv(process.env.GOOGLE_CLIENT_ID);
  const clientSecret = cleanEnv(process.env.GOOGLE_CLIENT_SECRET);
  if (!clientId || !clientSecret) {
    throw new Response(JSON.stringify({ error: 'Google Agenda nao configurado.' }), { status: 500 });
  }
  return { clientId, clientSecret };
}

export async function createGoogleAuthUrl(teacherId: string, origin: string) {
  const { clientId } = getGoogleCredentials();
  const state = randomBytes(24).toString('hex');

  await supabaseAdmin.from('google_oauth_states').insert({
    state,
    teacher_id: teacherId,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleRedirectUri(origin),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes.join(' '),
    state,
  });

  return `${authBase}?${params.toString()}`;
}

async function googleTokenRequest(body: Record<string, string>) {
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || 'Falha ao conectar com Google Agenda.');
  }
  return payload as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
}

export async function exchangeGoogleCode(code: string, origin: string) {
  const { clientId, clientSecret } = getGoogleCredentials();
  return googleTokenRequest({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: googleRedirectUri(origin),
    grant_type: 'authorization_code',
  });
}

async function refreshGoogleToken(refreshToken: string) {
  const { clientId, clientSecret } = getGoogleCredentials();
  return googleTokenRequest({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  });
}

export async function getGoogleEmail(accessToken: string) {
  const response = await fetch(userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = await response.json().catch(() => ({}));
  return typeof payload.email === 'string' ? payload.email : null;
}

export function expiresAt(expiresIn?: number) {
  const seconds = Math.max(60, expiresIn || 3600);
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export async function getValidGoogleConnection(teacherId: string) {
  const { data: connection, error } = await supabaseAdmin
    .from('google_calendar_connections')
    .select('*')
    .eq('teacher_id', teacherId)
    .maybeSingle();

  if (error) throw error;
  if (!connection) return null;

  const expiresAtValue = connection.expires_at ? new Date(connection.expires_at).getTime() : 0;
  const shouldRefresh = Boolean(connection.refresh_token) && expiresAtValue < Date.now() + 120000;
  if (!shouldRefresh) return connection;

  const refreshed = await refreshGoogleToken(connection.refresh_token);
  const payload = {
    access_token: refreshed.access_token,
    expires_at: expiresAt(refreshed.expires_in),
    updated_at: new Date().toISOString(),
  };

  const { data, error: updateError } = await supabaseAdmin
    .from('google_calendar_connections')
    .update(payload)
    .eq('teacher_id', teacherId)
    .select('*')
    .single();

  if (updateError) throw updateError;
  return data;
}

export async function disconnectGoogleConnection(teacherId: string) {
  await supabaseAdmin.from('google_calendar_events').delete().eq('teacher_id', teacherId);
  const { error } = await supabaseAdmin.from('google_calendar_connections').delete().eq('teacher_id', teacherId);
  if (error) throw error;
}

function toGoogleDateTime(classDate: string, classTime: string, durationMinutes: number) {
  const start = `${classDate}T${classTime.slice(0, 5)}:00`;
  const [hours, minutes] = classTime.slice(0, 5).split(':').map(Number);
  const endDate = new Date(`${classDate}T00:00:00`);
  endDate.setHours(hours || 0, (minutes || 0) + durationMinutes, 0, 0);
  const yyyy = endDate.getFullYear();
  const mm = String(endDate.getMonth() + 1).padStart(2, '0');
  const dd = String(endDate.getDate()).padStart(2, '0');
  const hh = String(endDate.getHours()).padStart(2, '0');
  const min = String(endDate.getMinutes()).padStart(2, '0');
  return {
    start: { dateTime: start, timeZone: 'America/Sao_Paulo' },
    end: { dateTime: `${yyyy}-${mm}-${dd}T${hh}:${min}:00`, timeZone: 'America/Sao_Paulo' },
  };
}

async function googleCalendarFetch(accessToken: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${calendarBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || 'Falha ao sincronizar Google Agenda.');
  }
  return payload;
}

async function googleGmailFetch(accessToken: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${gmailBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || 'Falha ao enviar e-mail pelo Gmail.');
  }
  return payload;
}

function gmailRawMessage(input: { to: string; subject: string; body: string }) {
  const mime = [
    `To: ${input.to}`,
    `Subject: =?UTF-8?B?${Buffer.from(input.subject, 'utf8').toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    '',
    input.body,
  ].join('\r\n');
  return Buffer.from(mime, 'utf8').toString('base64url');
}

async function classEventBody(item: any) {
  return {
    summary: `Aula - ${item.students?.full_name || 'Aluno'}`,
    description: `Aula sincronizada pelo LuminaAI.${item.subject ? `\nMateria: ${item.subject}` : ''}`,
    ...toGoogleDateTime(item.class_date, item.class_time, item.duration_minutes || 60),
  };
}

export async function createOrUpdateGoogleEventForClass(teacherId: string, classScheduleId: string) {
  const connection = await getValidGoogleConnection(teacherId);
  if (!connection) return { synced: false, reason: 'not_connected' as const };

  const { data: item, error } = await supabaseAdmin
    .from('class_schedules')
    .select('*, students(full_name, email)')
    .eq('teacher_id', teacherId)
    .eq('id', classScheduleId)
    .maybeSingle();
  if (error) throw error;
  if (!item || item.status !== 'scheduled') return { synced: false, reason: 'not_scheduled' as const };

  const existing = await supabaseAdmin
    .from('google_calendar_events')
    .select('google_event_id')
    .eq('class_schedule_id', item.id)
    .maybeSingle();

  const eventBody = await classEventBody(item);
  const eventId = existing.data?.google_event_id;
  if (eventId) {
    await googleCalendarFetch(connection.access_token, `/calendars/primary/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(eventBody),
    });
    return { synced: true, action: 'updated' as const };
  }

  const created = await googleCalendarFetch(connection.access_token, '/calendars/primary/events', {
    method: 'POST',
    body: JSON.stringify(eventBody),
  }) as { id?: string };
  if (created.id) {
    await supabaseAdmin.from('google_calendar_events').insert({
      teacher_id: teacherId,
      class_schedule_id: item.id,
      google_event_id: created.id,
    });
  }
  return { synced: true, action: 'created' as const };
}

export async function createStandaloneGoogleCalendarEvent(teacherId: string, input: {
  title: string;
  description?: string | null;
  class_date: string;
  class_time: string;
  duration_minutes?: number | null;
}) {
  const connection = await getValidGoogleConnection(teacherId);
  if (!connection) return { synced: false, reason: 'not_connected' as const };

  await googleCalendarFetch(connection.access_token, '/calendars/primary/events', {
    method: 'POST',
    body: JSON.stringify({
      summary: input.title,
      description: input.description || 'Evento criado pelo LumiBot.',
      ...toGoogleDateTime(input.class_date, input.class_time, input.duration_minutes || 60),
    }),
  });
  return { synced: true, action: 'created' as const };
}

export async function listGoogleCalendarEvents(teacherId: string, date: string) {
  const connection = await getValidGoogleConnection(teacherId);
  if (!connection) return { connected: false as const, events: [] };

  const timeMin = `${date}T00:00:00-03:00`;
  const timeMax = `${date}T23:59:59-03:00`;
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin,
    timeMax,
    maxResults: '20',
  });
  const payload = await googleCalendarFetch(connection.access_token, `/calendars/primary/events?${params.toString()}`) as { items?: any[] };
  return {
    connected: true as const,
    events: (payload.items || []).map((item) => ({
      id: item.id as string,
      summary: item.summary as string || 'Evento',
      description: item.description as string || '',
      start: item.start?.dateTime || item.start?.date || '',
      end: item.end?.dateTime || item.end?.date || '',
    })),
  };
}

export async function deleteGoogleEventForClass(teacherId: string, classScheduleId: string) {
  const connection = await getValidGoogleConnection(teacherId);
  if (!connection) return { synced: false, reason: 'not_connected' as const };

  const { data: eventRow, error } = await supabaseAdmin
    .from('google_calendar_events')
    .select('google_event_id')
    .eq('teacher_id', teacherId)
    .eq('class_schedule_id', classScheduleId)
    .maybeSingle();
  if (error) throw error;
  if (!eventRow?.google_event_id) return { synced: false, reason: 'not_found' as const };

  await googleCalendarFetch(connection.access_token, `/calendars/primary/events/${eventRow.google_event_id}`, {
    method: 'DELETE',
  });
  await supabaseAdmin
    .from('google_calendar_events')
    .delete()
    .eq('teacher_id', teacherId)
    .eq('class_schedule_id', classScheduleId);
  return { synced: true, action: 'deleted' as const };
}

export async function sendGmailMessage(teacherId: string, input: { to: string; subject: string; body: string }) {
  const connection = await getValidGoogleConnection(teacherId);
  if (!connection) {
    throw new Error('Conecte sua conta Google antes de enviar e-mails pelo LumiBot.');
  }
  return googleGmailFetch(connection.access_token, '/users/me/messages/send', {
    method: 'POST',
    body: JSON.stringify({ raw: gmailRawMessage(input) }),
  });
}

export async function createGmailDraft(teacherId: string, input: { to: string; subject: string; body: string }) {
  const connection = await getValidGoogleConnection(teacherId);
  if (!connection) {
    throw new Error('Conecte sua conta Google antes de criar rascunhos no Gmail.');
  }
  return googleGmailFetch(connection.access_token, '/users/me/drafts', {
    method: 'POST',
    body: JSON.stringify({ message: { raw: gmailRawMessage(input) } }),
  });
}

export async function searchGmailMessages(teacherId: string, query: string, maxResults = 5) {
  const connection = await getValidGoogleConnection(teacherId);
  if (!connection) return { connected: false as const, messages: [] };

  const params = new URLSearchParams({ q: query, maxResults: String(maxResults) });
  const list = await googleGmailFetch(connection.access_token, `/users/me/messages?${params.toString()}`) as { messages?: Array<{ id: string }> };
  const messages = await Promise.all((list.messages || []).slice(0, maxResults).map(async (message) => {
    const detail = await googleGmailFetch(
      connection.access_token,
      `/users/me/messages/${message.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`
    ) as { id: string; snippet?: string; payload?: { headers?: Array<{ name: string; value: string }> } };
    const headers = new Map((detail.payload?.headers || []).map((header) => [header.name.toLowerCase(), header.value]));
    return {
      id: detail.id,
      from: headers.get('from') || '',
      subject: headers.get('subject') || 'Sem assunto',
      date: headers.get('date') || '',
      snippet: detail.snippet || '',
    };
  }));

  return { connected: true as const, messages };
}

export async function syncTeacherClassesToGoogle(teacherId: string) {
  const connection = await getValidGoogleConnection(teacherId);
  if (!connection) {
    throw new Response(JSON.stringify({ error: 'Conecte o Google Agenda antes de sincronizar.' }), { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: classes, error } = await supabaseAdmin
    .from('class_schedules')
    .select('*, students(full_name, email)')
    .eq('teacher_id', teacherId)
    .eq('status', 'scheduled')
    .gte('class_date', today)
    .order('class_date')
    .order('class_time');

  if (error) throw error;
  let synced = 0;

  for (const item of classes || []) {
    const existing = await supabaseAdmin
      .from('google_calendar_events')
      .select('google_event_id')
      .eq('class_schedule_id', item.id)
      .maybeSingle();

    const eventBody = await classEventBody(item);

    const eventId = existing.data?.google_event_id;
    if (eventId) {
      await googleCalendarFetch(connection.access_token, `/calendars/primary/events/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify(eventBody),
      });
    } else {
      const created = await googleCalendarFetch(connection.access_token, '/calendars/primary/events', {
        method: 'POST',
        body: JSON.stringify(eventBody),
      }) as { id?: string };
      if (created.id) {
        await supabaseAdmin.from('google_calendar_events').insert({
          teacher_id: teacherId,
          class_schedule_id: item.id,
          google_event_id: created.id,
        });
      }
    }
    synced += 1;
  }

  return { synced };
}
