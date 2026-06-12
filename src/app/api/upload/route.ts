import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const bucket = 'activity-files';

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return json({ error: 'Arquivo nao enviado.' }, { status: 400 });
    }

    await supabaseAdmin.storage.createBucket(bucket, { public: true }).catch(() => null);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `${user.id}/${Date.now()}-${safeName}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error } = await supabaseAdmin.storage.from(bucket).upload(path, bytes, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });
    if (error) throw error;

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    return json({ url: data.publicUrl });
  } catch (error) {
    return apiError(error);
  }
}
