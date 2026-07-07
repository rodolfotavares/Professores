import { NextRequest } from 'next/server';
import { supabaseAdmin } from './supabase-admin';
import { assertSupabaseAdminConfigured } from './env';

export type ApiUser = {
  id: string;
  email?: string;
  role?: 'teacher' | 'student' | 'admin';
  full_name?: string;
};

export function currentSubscriptionMonth() {
  return new Date().toISOString().slice(0, 7);
}

function trialInfo(createdAt?: string | null) {
  const start = createdAt ? new Date(createdAt) : new Date();
  const endsAt = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  const msLeft = endsAt.getTime() - Date.now();
  return {
    trial_ends_at: endsAt.toISOString(),
    trial_days_left: Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000))),
    trial_expired: msLeft <= 0,
  };
}

export async function getTeacherSubscriptionStatus(teacherId: string, monthReference = currentSubscriptionMonth()) {
  const { data: teacherProfile } = await supabaseAdmin
    .from('teacher_profiles')
    .select('subscription_exempt')
    .eq('user_id', teacherId)
    .maybeSingle();

  if (teacherProfile?.subscription_exempt) {
    return {
      status: 'exempt',
      paid_at: null,
      month_reference: monthReference,
      amount: 0,
      exempt: true,
    };
  }

  const { data } = await supabaseAdmin
    .from('app_subscriptions')
    .select('status, paid_at, month_reference, amount, created_at')
    .eq('teacher_id', teacherId)
    .eq('month_reference', monthReference)
    .maybeSingle();

  if (data?.status === 'trial') {
    const trial = trialInfo(data.created_at);
    if (!trial.trial_expired) {
      return { ...data, ...trial, exempt: false };
    }

    return {
      ...data,
      status: 'pending',
      paid_at: null,
      ...trial,
      exempt: false,
    };
  }

  if (!data) {
    const { data: latestTrial } = await supabaseAdmin
      .from('app_subscriptions')
      .select('status, paid_at, month_reference, amount, created_at')
      .eq('teacher_id', teacherId)
      .eq('status', 'trial')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestTrial) {
      const trial = trialInfo(latestTrial.created_at);
      if (!trial.trial_expired) {
        return { ...latestTrial, month_reference: monthReference, ...trial, exempt: false };
      }
    }
  }

  return data || {
    status: 'pending',
    paid_at: null,
    month_reference: monthReference,
    amount: 19.9,
    exempt: false,
  };
}

function canTeacherUseApi(pathname: string) {
  return [
    '/api/me',
    '/api/teacher/subscription',
    '/api/teacher/telegram',
    '/api/payments/mercadopago/preference',
    '/api/payments/mercadopago/webhook',
    '/api/push',
  ].some((path) => pathname.startsWith(path));
}

async function assertTeacherSubscription(req: NextRequest, user: ApiUser) {
  if (user.role !== 'teacher') return;
  if (canTeacherUseApi(req.nextUrl.pathname)) return;

  const subscription = await getTeacherSubscriptionStatus(user.id);
  if (subscription.status !== 'paid' && subscription.status !== 'exempt' && subscription.status !== 'trial') {
    throw new Response(JSON.stringify({
      error: 'Seu teste gratis de 7 dias terminou. Acesse Financeiro e pague a mensalidade para liberar o app.',
      code: 'SUBSCRIPTION_REQUIRED',
    }), { status: 402 });
  }
}

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

  const user = {
    id: data.user.id,
    email: data.user.email || undefined,
    role: profile.role,
    full_name: profile.full_name,
  };

  await assertTeacherSubscription(req, user);
  return user;
}

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export function apiError(error: unknown) {
  if (error instanceof Response) return error;
  const message = error instanceof Error ? error.message : 'Erro inesperado.';
  return Response.json({ error: message }, { status: 500 });
}
