import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  grade: z.number().min(0).max(10),
  feedback: z.string().optional(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getApiUser(req);
    const body = schema.parse(await req.json());
    const params = await context.params;

    const { data, error } = await supabaseAdmin
      .from('activity_submissions')
      .update({
        grade: body.grade,
        feedback: body.feedback || '',
        status: 'corrected',
      })
      .eq('id', params.id)
      .eq('teacher_id', user.id)
      .select('*, activities(title), students(full_name)')
      .single();

    if (error) throw error;
    return json({ submission: data });
  } catch (error) {
    return apiError(error);
  }
}
