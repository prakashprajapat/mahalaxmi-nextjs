import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mahalaxmi Fashion Hub',
  description: 'Premium Indian Fashion — Sarees, Nighty, Petticoat & More',
  keywords: 'saree, nighty, petticoat, indian fashion, women clothing',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
