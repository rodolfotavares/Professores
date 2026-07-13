import type { Metadata } from 'next';
import { LanguageRuntime } from '@/components/LanguageRuntime';
import { PwaRegister } from '@/components/PwaRegister';
import './globals.css';

export const metadata: Metadata = {
  title: 'LuminaAI',
  description: 'Gestão de aulas particulares com professor e aluno sincronizados',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LuminaAI',
  },
  icons: {
    icon: [
      { url: '/icons/lumina-premium-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/lumina-premium-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/lumina-premium-apple-touch.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport = {
  themeColor: '#020617',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <PwaRegister />
        <LanguageRuntime />
        {children}
      </body>
    </html>
  );
}
