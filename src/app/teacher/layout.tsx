import { TeacherNav } from '@/components/AppNav';
import { RoleGate } from '@/components/RoleGate';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate expected="teacher">
      <main className="page">
        <div className="shell">
          <h1>Professor</h1>
          <TeacherNav />
          {children}
        </div>
      </main>
    </RoleGate>
  );
}
