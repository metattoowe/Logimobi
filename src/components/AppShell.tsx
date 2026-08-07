import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { NewOccurrenceModal } from '@/components/NewOccurrenceModal';
import { useStore } from '@/store/StoreContext';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [newOccOpen, setNewOccOpen] = useState(false);
  const navigate = useNavigate();
  const { properties, owners, occurrences } = useStore();

  const globalResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    const props = properties.filter(p =>
      p.address.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q)
    ).slice(0, 5);
    const owns = owners.filter(o => o.name.toLowerCase().includes(q)).slice(0, 5);
    const occs = occurrences.filter(o =>
      o.title.toLowerCase().includes(q) ||
      o.category.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q)
    ).slice(0, 5);
    return { props, owns, occs };
  }, [search, properties, owners, occurrences]);

  return (
    <div className="min-h-screen bg-ink-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          search={search}
          onSearchChange={setSearch}
          actions={
            <button onClick={() => setNewOccOpen(true)} className="btn-brand hidden sm:inline-flex">
              + Nova Ocorrência
            </button>
          }
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet context={{ search }} />
        </main>
      </div>

      {globalResults && (
        <div className="fixed left-1/2 top-14 z-30 w-full max-w-md -translate-x-1/2 px-4 sm:left-[calc(50%+8rem)]">
          <div className="card max-h-[60vh] overflow-y-auto p-2">
            {globalResults.owns.length === 0 && globalResults.props.length === 0 && globalResults.occs.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-ink-400">Nenhum resultado para "{search}"</p>
            ) : (
              <>
                {globalResults.owns.map(o => (
                  <button key={o.id} onClick={() => { navigate(`/proprietarios/${o.id}`); setSearch(''); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-ink-50">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-600">{o.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</span>
                    <span className="text-sm text-ink-800">{o.name}</span>
                    <span className="ml-auto text-xs text-ink-400">Proprietário</span>
                  </button>
                ))}
                {globalResults.props.map(p => (
                  <button key={p.id} onClick={() => { navigate(`/imoveis/${p.id}`); setSearch(''); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-ink-50">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-yellow-100 text-xs font-semibold text-brand-yellow-800">{p.code.slice(-3)}</span>
                    <span className="text-sm text-ink-800">{p.address}</span>
                    <span className="ml-auto text-xs text-ink-400">{p.city}</span>
                  </button>
                ))}
                {globalResults.occs.map(o => {
                  const prop = properties.find(p => p.id === o.property_id);
                  return (
                    <button key={o.id} onClick={() => { if (prop) { navigate(`/imoveis/${prop.id}`); setSearch(''); } }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-ink-50">
                      <span className="h-2 w-2 rounded-full bg-brand-red-500" />
                      <span className="text-sm text-ink-800">{o.title}</span>
                      <span className="ml-auto text-xs text-ink-400">{o.category}</span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}

      <NewOccurrenceModal open={newOccOpen} onClose={() => setNewOccOpen(false)} />
    </div>
  );
}
