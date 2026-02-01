import type { Metadata } from 'next';
import { Footer } from '@heady/ui';

export const metadata: Metadata = {
  title: 'HeadySystems',
  description: 'Enterprise automation and productivity platform',
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
        <Footer companyName="HeadySystems" />
      </body>
    </html>
  );
}
