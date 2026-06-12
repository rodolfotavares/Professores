import { RegisterForm } from '@/components/AuthForm';

export default function RegisterTeacherPage() {
  return (
    <main className="auth-shell">
      <RegisterForm mode="teacher" />
    </main>
  );
}
