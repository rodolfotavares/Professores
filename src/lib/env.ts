export function hasRealValue(value: string | undefined, invalidParts: string[]) {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return !invalidParts.some((part) => normalized.includes(part));
}

export function isSupabaseBrowserConfigured() {
  return (
    hasRealValue(process.env.NEXT_PUBLIC_SUPABASE_URL, ['example', 'seu-projeto']) &&
    hasRealValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, ['missing', 'sua-chave'])
  );
}

export function isSupabaseAdminConfigured() {
  return isSupabaseBrowserConfigured() && hasRealValue(process.env.SUPABASE_SERVICE_ROLE_KEY, ['missing', 'sua-chave']);
}

export function assertSupabaseAdminConfigured() {
  if (!isSupabaseAdminConfigured()) {
    throw new Response(
      JSON.stringify({ error: 'Supabase nao configurado. Configure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY.' }),
      { status: 500 },
    );
  }
}
