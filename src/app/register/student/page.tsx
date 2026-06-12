import { RegisterForm } from '@/components/AuthForm';

export default function RegisterStudentPage() {
  return (
    <main className="auth-shell">
      <RegisterForm mode="student" />
    </main>
  );
}
