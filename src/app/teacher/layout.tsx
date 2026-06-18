import { TeacherNav } from '@/components/AppNav';
import { AppLayout } from '@/components/AppShell';
import { RoleGate } from '@/components/RoleGate';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate expected="teacher">
      <main className="page teacher-portal">
        <TeacherNav />
        <AppLayout area="teacher">
          {children}
        </AppLayout>
      </main>
    </RoleGate>
  );
}
