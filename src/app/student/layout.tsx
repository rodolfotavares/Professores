import { StudentNav } from '@/components/AppNav';
import { AppLayout } from '@/components/AppShell';
import { RoleGate } from '@/components/RoleGate';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate expected="student">
      <main className="page student-portal">
        <StudentNav />
        <AppLayout area="student">
          {children}
        </AppLayout>
      </main>
    </RoleGate>
  );
}
