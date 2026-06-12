import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);

    const { data: student, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return json({ student });
  } catch (error) {
    return apiError(error);
  }
}
