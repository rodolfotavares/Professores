import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { getVapidPublicKey, isPushConfigured } from '@/lib/push';

export async function GET(req: NextRequest) {
  try {
    await getApiUser(req);
    return json({
      publicKey: getVapidPublicKey(),
      configured: isPushConfigured(),
    });
  } catch (error) {
    return apiError(error);
  }
}
