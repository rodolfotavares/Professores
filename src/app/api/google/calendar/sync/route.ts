import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { syncTeacherClassesToGoogle } from '@/lib/google-calendar';

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return json({ error: 'Sem permissao.' }, { status: 403 });
    }

    const result = await syncTeacherClassesToGoogle(user.id);
    return json(result);
  } catch (error) {
    return apiError(error);
  }
}
