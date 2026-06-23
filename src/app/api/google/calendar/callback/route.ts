import { NextRequest } from 'next/server';
import { exchangeGoogleCode, expiresAt, getGoogleEmail } from '@/lib/google-calendar';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error || !code || !state) {
    return Response.redirect(new URL('/teacher/schedule?google=error', req.url));
  }

  try {
    const { data: oauthState } = await supabaseAdmin
      .from('google_oauth_states')
      .select('*')
      .eq('state', state)
      .maybeSingle();

    if (!oauthState) {
      return Response.redirect(new URL('/teacher/schedule?google=invalid_state', req.url));
    }

    const token = await exchangeGoogleCode(code, url.origin);
    const googleEmail = await getGoogleEmail(token.access_token);

    const payload = {
      teacher_id: oauthState.teacher_id,
      google_email: googleEmail,
      access_token: token.access_token,
      refresh_token: token.refresh_token || null,
      expires_at: expiresAt(token.expires_in),
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin
      .from('google_calendar_connections')
      .select('id, refresh_token')
      .eq('teacher_id', oauthState.teacher_id)
      .maybeSingle();

    if (existing?.id) {
      await supabaseAdmin
        .from('google_calendar_connections')
        .update({ ...payload, refresh_token: token.refresh_token || existing.refresh_token })
        .eq('id', existing.id);
    } else {
      await supabaseAdmin.from('google_calendar_connections').insert(payload);
    }

    await supabaseAdmin.from('google_oauth_states').delete().eq('state', state);
    return Response.redirect(new URL('/teacher/schedule?google=connected', req.url));
  } catch {
    return Response.redirect(new URL('/teacher/schedule?google=error', req.url));
  }
}
