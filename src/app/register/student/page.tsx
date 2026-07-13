import { RegisterForm } from '@/components/AuthForm';

export default async function RegisterStudentPage({ searchParams }: { searchParams?: Promise<{ invite?: string }> }) {
  const params = await searchParams;

  return (
    <main className="auth-shell">
      <RegisterForm mode="student" inviteToken={params?.invite || ''} />
    </main>
  );
}
