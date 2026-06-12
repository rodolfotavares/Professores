import { StudentNav } from '@/components/AppNav';
import { RoleGate } from '@/components/RoleGate';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate expected="student">
      <main className="page student-portal">
        <div className="shell">
          <h1>Aluno</h1>
          <StudentNav />
          {children}
        </div>
      </main>
    </RoleGate>
  );
}
