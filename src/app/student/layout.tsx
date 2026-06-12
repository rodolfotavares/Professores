import { StudentNav } from '@/components/AppNav';
import { RoleGate } from '@/components/RoleGate';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate expected="student">
      <main className="page student-portal">
        <StudentNav />
        <div className="shell">
          {children}
        </div>
      </main>
    </RoleGate>
  );
}
