import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { getValidZoomConnection } from '@/lib/zoom';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return json({ error: 'Sem permissao.' }, { status: 403 });
    }

    const connection = await getValidZoomConnection(user.id);
    return json({
      connected: Boolean(connection),
      zoom_email: connection?.zoom_email || null,
    });
  } catch (error) {
    return apiError(error);
  }
}
