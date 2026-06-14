'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 min-h-screen">
        <Header onToggleSidebar={() => setMobileOpen((prev) => !prev)} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
