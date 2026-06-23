import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { getValidGoogleConnection } from '@/lib/google-calendar';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return json({ error: 'Sem permissao.' }, { status: 403 });
    }

    const connection = await getValidGoogleConnection(user.id);
    return json({
      connected: Boolean(connection),
      google_email: connection?.google_email || null,
    });
  } catch (error) {
    return apiError(error);
  }
}
