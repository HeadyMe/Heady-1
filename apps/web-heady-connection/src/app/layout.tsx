import type { Metadata } from 'next';
import { Footer } from '@heady/ui';

export const metadata: Metadata = {
  title: 'HeadyConnection',
  description: 'Nonprofit platform for social impact and community connection',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', margin: 0 }}>
        <main style={{ flex: 1 }}>
          {children}
        </main>
        <Footer companyName="HeadyConnection" />
      </body>
    </html>
  );
}
