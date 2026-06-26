import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { createZoomMeetingForClass } from '@/lib/zoom';

const schema = z.object({
  class_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return json({ error: 'Sem permissao.' }, { status: 403 });
    }

    const body = schema.parse(await req.json());
    const classItem = await createZoomMeetingForClass(user.id, body.class_id);
    return json({ class: classItem });
  } catch (error) {
    return apiError(error);
  }
}
