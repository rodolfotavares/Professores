import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  status: z.enum(['scheduled', 'completed', 'cancelled', 'absence']),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getApiUser(req);
    const body = schema.parse(await req.json());
    const params = await context.params;

    const { data, error } = await supabaseAdmin
      .from('class_schedules')
      .update({ status: body.status })
      .eq('id', params.id)
      .eq('teacher_id', user.id)
      .select('*')
      .single();

    if (error) throw error;
    return json({ class: data });
  } catch (error) {
    return apiError(error);
  }
}
