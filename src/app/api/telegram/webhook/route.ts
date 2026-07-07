import { NextRequest } from 'next/server';
import { apiError, json } from '@/lib/api-auth';
import { expectedTelegramSecret, handleTelegramUpdate } from '@/lib/luminabot';

export async function POST(req: NextRequest) {
  try {
    const expectedSecret = expectedTelegramSecret();
    if (!expectedSecret) {
      return json({ error: 'TELEGRAM_WEBHOOK_SECRET nao configurado.' }, { status: 503 });
    }

    const receivedSecret = req.headers.get('x-telegram-bot-api-secret-token') || '';
    if (receivedSecret !== expectedSecret) {
      return json({ error: 'Nao autorizado.' }, { status: 401 });
    }

    const update = await req.json();
    await handleTelegramUpdate(update);
    return json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
