import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    const subscription = subscriptionSchema.parse(await req.json());

    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        role: user.role || 'student',
        endpoint: subscription.endpoint,
        subscription,
        user_agent: req.headers.get('user-agent') || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'endpoint' });

    if (error) throw error;

    return json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
