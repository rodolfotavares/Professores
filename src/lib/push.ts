import webPush, { PushSubscription } from 'web-push';
import { supabaseAdmin } from './supabase-admin';

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '';
}

export function isPushConfigured() {
  return Boolean(getVapidPublicKey() && process.env.VAPID_PRIVATE_KEY);
}

function configureWebPush() {
  const publicKey = getVapidPublicKey();
  const privateKey = process.env.VAPID_PRIVATE_KEY || '';

  if (!publicKey || !privateKey) {
    throw new Error('Notificacoes push ainda nao foram configuradas no servidor.');
  }

  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:suporte@luminaai.app',
    publicKey,
    privateKey,
  );
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  configureWebPush();

  const { data, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, subscription')
    .eq('user_id', userId);

  if (error) throw error;

  const subscriptions = data || [];
  const results = await Promise.allSettled(
    subscriptions.map(async (item) => {
      try {
        await webPush.sendNotification(item.subscription as PushSubscription, JSON.stringify(payload));
        await supabaseAdmin
          .from('push_subscriptions')
          .update({ last_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', item.id);
      } catch (error) {
        const statusCode = typeof error === 'object' && error && 'statusCode' in error ? Number(error.statusCode) : 0;
        if (statusCode === 404 || statusCode === 410) {
          await supabaseAdmin.from('push_subscriptions').delete().eq('id', item.id);
        }
        throw error;
      }
    }),
  );

  return {
    sent: results.filter((result) => result.status === 'fulfilled').length,
    failed: results.filter((result) => result.status === 'rejected').length,
    total: subscriptions.length,
  };
}
