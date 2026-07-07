import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { sendPushToUser } from '@/lib/push';

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    const targetUrl = user.role === 'teacher' ? '/teacher' : '/student';
    const result = await sendPushToUser(user.id, {
      title: 'LuminaAI',
      body: 'Notificacoes ativadas. Seus lembretes importantes chegarao por aqui.',
      url: targetUrl,
    });

    return json(result);
  } catch (error) {
    return apiError(error);
  }
}
