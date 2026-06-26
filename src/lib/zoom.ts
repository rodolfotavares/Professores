import { randomBytes } from 'crypto';
import { supabaseAdmin } from './supabase-admin';

const authBase = 'https://zoom.us/oauth/authorize';
const tokenUrl = 'https://zoom.us/oauth/token';
const zoomApiBase = 'https://api.zoom.us/v2';

function cleanEnv(value?: string) {
  return (value || '').normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

export function zoomRedirectUri(origin: string) {
  return `${origin}/api/zoom/callback`;
}

export function getZoomCredentials() {
  const clientId = cleanEnv(process.env.ZOOM_CLIENT_ID);
  const clientSecret = cleanEnv(process.env.ZOOM_CLIENT_SECRET);
  if (!clientId || !clientSecret) {
    throw new Response(JSON.stringify({ error: 'Zoom nao configurado. Configure ZOOM_CLIENT_ID e ZOOM_CLIENT_SECRET.' }), { status: 500 });
  }
  return { clientId, clientSecret };
}

export async function createZoomAuthUrl(teacherId: string, origin: string) {
  const { clientId } = getZoomCredentials();
  const state = randomBytes(24).toString('hex');

  await supabaseAdmin.from('zoom_oauth_states').insert({
    state,
    teacher_id: teacherId,
  });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: zoomRedirectUri(origin),
    state,
  });

  return `${authBase}?${params.toString()}`;
}

function zoomAuthorizationHeader() {
  const { clientId, clientSecret } = getZoomCredentials();
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
}

async function zoomTokenRequest(body: Record<string, string>) {
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: zoomAuthorizationHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.reason || payload.error_description || payload.error || 'Falha ao conectar com Zoom.');
  }
  return payload as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
}

export async function exchangeZoomCode(code: string, origin: string) {
  return zoomTokenRequest({
    code,
    redirect_uri: zoomRedirectUri(origin),
    grant_type: 'authorization_code',
  });
}

async function refreshZoomToken(refreshToken: string) {
  return zoomTokenRequest({
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
}

export function expiresAt(expiresIn?: number) {
  const seconds = Math.max(60, expiresIn || 3600);
  return new Date(Date.now() + seconds * 1000).toISOString();
}

async function zoomFetch(accessToken: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${zoomApiBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || payload.reason || 'Falha ao chamar a API do Zoom.');
  }
  return payload;
}

export async function getZoomUser(accessToken: string) {
  const payload = await zoomFetch(accessToken, '/users/me') as { id?: string; email?: string };
  return {
    zoom_user_id: payload.id || null,
    zoom_email: payload.email || null,
  };
}

export async function getValidZoomConnection(teacherId: string) {
  const { data: connection, error } = await supabaseAdmin
    .from('zoom_connections')
    .select('*')
    .eq('teacher_id', teacherId)
    .maybeSingle();

  if (error) throw error;
  if (!connection) return null;

  const expiresAtValue = connection.expires_at ? new Date(connection.expires_at).getTime() : 0;
  const shouldRefresh = Boolean(connection.refresh_token) && expiresAtValue < Date.now() + 120000;
  if (!shouldRefresh) return connection;

  const refreshed = await refreshZoomToken(connection.refresh_token);
  const payload = {
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token || connection.refresh_token,
    expires_at: expiresAt(refreshed.expires_in),
    updated_at: new Date().toISOString(),
  };

  const { data, error: updateError } = await supabaseAdmin
    .from('zoom_connections')
    .update(payload)
    .eq('teacher_id', teacherId)
    .select('*')
    .single();

  if (updateError) throw updateError;
  return data;
}

function zoomStartTime(classDate: string, classTime: string) {
  return `${classDate}T${classTime.slice(0, 5)}:00`;
}

export async function createZoomMeetingForClass(teacherId: string, classId: string) {
  const connection = await getValidZoomConnection(teacherId);
  if (!connection) {
    throw new Response(JSON.stringify({ error: 'Conecte o Zoom nas Configuracoes antes de iniciar aula online.' }), { status: 400 });
  }

  const { data: classItem, error } = await supabaseAdmin
    .from('class_schedules')
    .select('*, students(full_name)')
    .eq('id', classId)
    .eq('teacher_id', teacherId)
    .single();

  if (error || !classItem) {
    throw new Response(JSON.stringify({ error: 'Aula nao encontrada.' }), { status: 404 });
  }

  if (classItem.meeting_provider === 'zoom' && classItem.meeting_url && classItem.meeting_start_url) {
    return classItem;
  }

  const meeting = await zoomFetch(connection.access_token, '/users/me/meetings', {
    method: 'POST',
    body: JSON.stringify({
      topic: `Aula LuminaAI - ${classItem.students?.full_name || 'Aluno'}`,
      type: 2,
      start_time: zoomStartTime(classItem.class_date, classItem.class_time),
      duration: classItem.duration_minutes || 60,
      timezone: 'America/Sao_Paulo',
      agenda: classItem.subject ? `Materia: ${classItem.subject}` : 'Aula criada pelo LuminaAI.',
      settings: {
        join_before_host: false,
        waiting_room: true,
        approval_type: 2,
        audio: 'voip',
      },
    }),
  }) as { id?: string | number; join_url?: string; start_url?: string };

  const update = {
    meeting_provider: 'zoom',
    meeting_url: meeting.join_url || null,
    meeting_start_url: meeting.start_url || null,
    external_meeting_id: meeting.id ? String(meeting.id) : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error: updateError } = await supabaseAdmin
    .from('class_schedules')
    .update(update)
    .eq('id', classId)
    .eq('teacher_id', teacherId)
    .select('*, students(full_name)')
    .single();

  if (updateError) throw updateError;
  return data;
}
