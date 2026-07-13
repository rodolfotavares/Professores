import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { syncTeacherClassesToGoogle } from '@/lib/google-calendar';

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return json({ error: 'Sem permissao.' }, { status: 403 });
    }

    let createMeet = true;
    try {
      const body = await req.json();
      createMeet = body?.createMeet !== false;
    } catch {
      createMeet = true;
    }

    const result = await syncTeacherClassesToGoogle(user.id, { createMeet });
    return json(result);
  } catch (error) {
    return apiError(error);
  }
}
