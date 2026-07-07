import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { botUsername, newConnectionCode } from '@/lib/luminabot';
import { supabaseAdmin } from '@/lib/supabase-admin';

function codeExpiration() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

async function ensureConnection(teacherId: string) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('telegram_bot_connections')
    .select('*')
    .eq('teacher_id', teacherId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing;

  const { data, error } = await supabaseAdmin
    .from('telegram_bot_connections')
    .insert({
      teacher_id: teacherId,
      connection_code: newConnectionCode(),
      code_expires_at: codeExpiration(),
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return json({ error: 'Sem permissao.' }, { status: 403 });
    }

    const connection = await ensureConnection(user.id);
    return json({
      connection: {
        connection_code: connection.connection_code,
        code_expires_at: connection.code_expires_at,
        connected: Boolean(connection.telegram_user_id),
        telegram_username: connection.telegram_username,
        telegram_first_name: connection.telegram_first_name,
        connected_at: connection.connected_at,
      },
      bot_username: botUsername(),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return json({ error: 'Sem permissao.' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('telegram_bot_connections')
      .upsert({
        teacher_id: user.id,
        connection_code: newConnectionCode(),
        code_expires_at: codeExpiration(),
        telegram_user_id: null,
        telegram_username: null,
        telegram_first_name: null,
        telegram_chat_id: null,
        pending_action: null,
        connected_at: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'teacher_id' })
      .select('*')
      .single();
    if (error) throw error;

    return json({
      connection: {
        connection_code: data.connection_code,
        code_expires_at: data.code_expires_at,
        connected: false,
      },
      bot_username: botUsername(),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return json({ error: 'Sem permissao.' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('telegram_bot_connections')
      .update({
        telegram_user_id: null,
        telegram_username: null,
        telegram_first_name: null,
        telegram_chat_id: null,
        pending_action: null,
        connected_at: null,
        connection_code: newConnectionCode(),
        code_expires_at: codeExpiration(),
        updated_at: new Date().toISOString(),
      })
      .eq('teacher_id', user.id);
    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
