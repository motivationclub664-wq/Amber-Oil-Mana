import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AppShell from '../components/AppShell';
import ToasterProvider from '../components/ToasterProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Business Manager',
  description: ' quản lý cửa hàng đơn giản ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <AppShell>
          {children}
        </AppShell>
        <ToasterProvider />
      </body>
    </html>
  );
}
