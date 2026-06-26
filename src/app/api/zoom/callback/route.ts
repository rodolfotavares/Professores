import { NextRequest } from 'next/server';
import { exchangeZoomCode, expiresAt, getZoomUser } from '@/lib/zoom';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error || !code || !state) {
    return Response.redirect(new URL('/teacher/settings?zoom=error', req.url));
  }

  try {
    const { data: oauthState } = await supabaseAdmin
      .from('zoom_oauth_states')
      .select('*')
      .eq('state', state)
      .maybeSingle();

    if (!oauthState) {
      return Response.redirect(new URL('/teacher/settings?zoom=invalid_state', req.url));
    }

    const token = await exchangeZoomCode(code, url.origin);
    const zoomUser = await getZoomUser(token.access_token);

    const payload = {
      teacher_id: oauthState.teacher_id,
      zoom_user_id: zoomUser.zoom_user_id,
      zoom_email: zoomUser.zoom_email,
      access_token: token.access_token,
      refresh_token: token.refresh_token || null,
      expires_at: expiresAt(token.expires_in),
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin
      .from('zoom_connections')
      .select('id, refresh_token')
      .eq('teacher_id', oauthState.teacher_id)
      .maybeSingle();

    if (existing?.id) {
      await supabaseAdmin
        .from('zoom_connections')
        .update({ ...payload, refresh_token: token.refresh_token || existing.refresh_token })
        .eq('id', existing.id);
    } else {
      await supabaseAdmin.from('zoom_connections').insert(payload);
    }

    await supabaseAdmin.from('zoom_oauth_states').delete().eq('state', state);
    return Response.redirect(new URL('/teacher/settings?zoom=connected', req.url));
  } catch {
    return Response.redirect(new URL('/teacher/settings?zoom=error', req.url));
  }
}
