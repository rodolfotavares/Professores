import { TeacherNav } from '@/components/AppNav';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="page">
      <div className="shell">
        <h1>Professor</h1>
        <TeacherNav />
        {children}
      </div>
    </main>
  );
}
