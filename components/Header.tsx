type HeaderProps = {
  onToggleSidebar?: () => void;
};

export default function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {onToggleSidebar ? (
            <button type="button" onClick={onToggleSidebar} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 md:hidden">
              <span className="text-lg font-semibold">☰</span>
            </button>
          ) : null}
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Business Manager</h1>
            <p className="text-sm text-slate-500">Bảng điều khiển và quản lý dữ liệu của cửa hàng</p>
          </div>
        </div>
      </div>
    </header>
  );
}
