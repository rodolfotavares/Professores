import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const bucket = 'activity-files';
const maxFileSize = 25 * 1024 * 1024;

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
]);

const allowedExtensions = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'mp4',
  'webm',
  'mov',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
]);

function extensionOf(fileName: string) {
  return (fileName.split('.').pop() || '').toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return json({ error: 'Arquivo não enviado.' }, { status: 400 });
    }

    if (file.size <= 0 || file.size > maxFileSize) {
      return json({ error: 'Arquivo muito grande. Envie arquivos de até 25 MB.' }, { status: 413 });
    }

    const extension = extensionOf(file.name);
    if (!allowedMimeTypes.has(file.type) || !allowedExtensions.has(extension)) {
      return json({ error: 'Tipo de arquivo não permitido.' }, { status: 415 });
    }

    await supabaseAdmin.storage.createBucket(bucket, { public: true }).catch(() => null);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 90);
    const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error } = await supabaseAdmin.storage.from(bucket).upload(path, bytes, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw error;

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    return json({ url: data.publicUrl });
  } catch (error) {
    return apiError(error);
  }
}
