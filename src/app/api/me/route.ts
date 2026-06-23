import { NextRequest } from 'next/server';
import { apiError, getApiUser, getTeacherSubscriptionStatus, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const subscription = profile?.role === 'teacher'
      ? await getTeacherSubscriptionStatus(user.id)
      : null;

    return json({ profile: subscription ? { ...profile, subscription } : profile });
  } catch (error) {
    return apiError(error);
  }
}
