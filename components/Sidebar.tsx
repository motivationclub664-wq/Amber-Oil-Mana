import Link from 'next/link';

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

const nav = [
  { label: 'Dashboard', href: '/' },
  { label: 'Referers', href: '/referers' },
  { label: 'Customers', href: '/customers' },
  { label: 'Products', href: '/products' },
  { label: 'Orders', href: '/orders' },
  { label: 'Stocks', href: '/stocks' },
];

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  return (
    <>
      <aside className="hidden md:flex md:w-72 xl:w-80 flex-col bg-slate-900 text-slate-100">
        <div className="p-6 border-b border-slate-800">
          <div className="text-xl font-semibold">Business Manager</div>
          <p className="mt-2 text-sm text-slate-400">Quản lý sản phẩm, đơn hàng và kho hiệu quả.</p>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
          <aside className="relative z-50 h-full w-72 flex flex-col bg-slate-900 text-slate-100">
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold">Business Manager</div>
                  <p className="mt-2 text-sm text-slate-400">Quản lý sản phẩm, đơn hàng và kho hiệu quả.</p>
                </div>
                <button onClick={onClose} className="rounded-full bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700">Đóng</button>
              </div>
            </div>
            <nav className="flex-1 p-6 space-y-2">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} onClick={onClose} className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-white">
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}
