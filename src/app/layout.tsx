import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EduAssist Pro',
  description: 'Gestao de aulas particulares com professor e aluno sincronizados',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
