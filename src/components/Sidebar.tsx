import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, ClipboardList, FileBarChart, Settings, X, Building, UserCog, UserCircle, Shield } from 'lucide-react';
import { useAuth } from '@/store/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/proprietarios', label: 'Proprietários', icon: Users },
  { to: '/inquilinos', label: 'Inquilinos', icon: UserCircle },
  { to: '/imoveis', label: 'Imóveis', icon: Building2 },
  { to: '/ocorrencias', label: 'Ocorrências', icon: ClipboardList },
  { to: '/relatorios', label: 'Relatórios', icon: FileBarChart },
  { to: '/usuarios', label: 'Usuários', icon: UserCog },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { company, isPlatformAdmin } = useAuth();

  const items = isPlatformAdmin
    ? [{ to: '/admin', label: 'Painel Admin', icon: Shield }, ...navItems.filter(i => i.to !== '/usuarios' && i.to !== '/configuracoes')]
    : navItems;

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink-900/40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-ink-200 bg-white transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center gap-2.5 border-b border-ink-100 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900 text-white">
            <Building size={20} />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-ink-900">LogImobi</p>
            <p className="text-xs leading-tight text-ink-400">Gestão de Ocorrências</p>
          </div>
          <button onClick={onClose} className="ml-auto rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 lg:hidden">
            <X size={18} />
          </button>
        </div>
        <nav className="flex flex-col gap-0.5 p-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        {company && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-ink-100 p-4">
            <p className="text-xs font-medium text-ink-700 truncate">{company.name}</p>
            <p className="text-xs text-ink-400">Plano: {company.plan}</p>
          </div>
        )}
        {isPlatformAdmin && !company && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-ink-100 p-4">
            <p className="text-xs font-medium text-ink-700 truncate">Administrador da Plataforma</p>
            <p className="text-xs text-ink-400">Acesso global</p>
          </div>
        )}
      </aside>
    </>
  );
}
