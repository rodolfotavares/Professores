import { TeacherNav } from '@/components/AppNav';
import { RoleGate } from '@/components/RoleGate';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate expected="teacher">
      <main className="page teacher-portal">
        <TeacherNav />
        <div className="shell">
          {children}
        </div>
      </main>
    </RoleGate>
  );
}
