import { StudentNav } from '@/components/AppNav';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="page">
      <div className="shell">
        <h1>Aluno</h1>
        <StudentNav />
        {children}
      </div>
    </main>
  );
}
