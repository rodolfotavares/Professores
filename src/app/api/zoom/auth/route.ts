import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { createZoomAuthUrl } from '@/lib/zoom';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return json({ error: 'Sem permissao.' }, { status: 403 });
    }

    const url = await createZoomAuthUrl(user.id, req.nextUrl.origin);
    return json({ url });
  } catch (error) {
    return apiError(error);
  }
}
