import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { createGoogleAuthUrl } from '@/lib/google-calendar';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return json({ error: 'Sem permissao.' }, { status: 403 });
    }

    const url = await createGoogleAuthUrl(user.id, req.nextUrl.origin);
    return json({ url });
  } catch (error) {
    return apiError(error);
  }
}
