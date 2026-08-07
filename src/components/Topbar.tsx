import { useState, type ReactNode } from 'react';
import { Menu, Search, LogOut, Bell } from 'lucide-react';
import { useAuth } from '@/store/AuthContext';

interface TopbarProps {
  onMenuClick: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  actions?: ReactNode;
}

export function Topbar({ onMenuClick, search, onSearchChange, actions }: TopbarProps) {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-200 bg-white/80 px-4 backdrop-blur-md sm:px-6">
      <button onClick={onMenuClick} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 lg:hidden">
        <Menu size={20} />
      </button>

      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Pesquisar proprietário, imóvel, ocorrência..."
          className="w-full rounded-lg border border-ink-200 bg-ink-50 py-2 pl-9 pr-3 text-sm text-ink-900 placeholder-ink-400 outline-none transition-colors focus:border-ink-300 focus:bg-white"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {actions}
        <button className="relative rounded-lg p-2 text-ink-500 hover:bg-ink-100">
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-red-500" />
        </button>
        <div className="relative">
          <button onClick={() => setMenuOpen(o => !o)} className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-ink-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-white">
              {user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('') || '?'}
            </div>
            <span className="hidden text-sm font-medium text-ink-700 sm:block">{user?.name?.split(' ')[0]}</span>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-ink-200 bg-white p-1.5 shadow-card">
                <div className="border-b border-ink-100 px-3 py-2.5">
                  <p className="text-sm font-semibold text-ink-900">{user?.name}</p>
                  <p className="truncate text-xs text-ink-500">{user?.email}</p>
                </div>
                <button onClick={signOut} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-ink-100 hover:text-brand-red-600">
                  <LogOut size={16} /> Sair da conta
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
