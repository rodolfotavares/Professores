import { NextRequest } from 'next/server';
import { supabaseAdmin } from './supabase-admin';
import { assertSupabaseAdminConfigured } from './env';

export type ApiUser = {
  id: string;
  email?: string;
  role?: 'teacher' | 'student' | 'admin';
  full_name?: string;
};

export async function getApiUser(req: NextRequest): Promise<ApiUser> {
  assertSupabaseAdminConfigured();

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    throw new Response(JSON.stringify({ error: 'Nao autenticado.' }), { status: 401 });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    throw new Response(JSON.stringify({ error: 'Sessao invalida.' }), { status: 401 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    throw new Response(JSON.stringify({ error: 'Perfil nao encontrado.' }), { status: 403 });
  }

  return {
    id: data.user.id,
    email: data.user.email || undefined,
    role: profile.role,
    full_name: profile.full_name,
  };
}

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export function apiError(error: unknown) {
  if (error instanceof Response) return error;
  const message = error instanceof Error ? error.message : 'Erro inesperado.';
  return Response.json({ error: message }, { status: 500 });
}
