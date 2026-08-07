import { useOutletContext, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Eye, Pencil, Trash2, Plus, Search, Building2, Loader2 } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/store/ToastContext';
import { propertyStatusStyles } from '@/lib/status';
import type { Property, PropertyStatus } from '@/types';
import { PropertyFormModal } from '@/components/PropertyFormModal';

interface OutletCtx { search: string }

export function PropertiesPage() {
  const { search } = useOutletContext<OutletCtx>();
  const { properties, getOwner, deleteProperty, loading } = useStore();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirm, setConfirm] = useState<Property | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editProp, setEditProp] = useState<Property | null>(null);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-ink-400" /></div>;
  }

  const cities = Array.from(new Set(properties.map(p => p.city))).sort();
  const statuses: PropertyStatus[] = ['Disponível', 'Alugado', 'Em venda', 'Vendido', 'Em reforma'];

  const q = (search || localSearch).trim().toLowerCase();
  const filtered = properties.filter(p =>
    (!q || p.address.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.district.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)) &&
    (!cityFilter || p.city === cityFilter) &&
    (!statusFilter || p.status === statusFilter)
  );

  const handleDelete = async (prop: Property) => {
    try {
      await deleteProperty(prop.id);
      notify('Imóvel excluído com sucesso.', 'success');
    } catch {
      notify('Erro ao excluir imóvel.', 'error');
    }
    setConfirm(null);
  };

  const openEdit = (prop: Property) => {
    setEditProp(prop);
    setFormOpen(true);
  };

  const openNew = () => {
    setEditProp(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Imóveis</h1>
          <p className="text-sm text-ink-500">{filtered.length} imóvel{filtered.length !== 1 ? 'veis' : ''}</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={16} /> Novo Imóvel</button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={localSearch} onChange={e => setLocalSearch(e.target.value)} placeholder="Buscar por endereço, código, bairro..." className="input pl-9" />
          </div>
          <div className="flex gap-3">
            <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="input min-w-[140px]">
              <option value="">Todas as cidades</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input min-w-[140px]">
              <option value="">Todos os status</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card px-6 py-16 text-center">
          <Building2 className="mx-auto text-ink-300" size={40} />
          <p className="mt-3 text-sm font-medium text-ink-700">Nenhum imóvel cadastrado</p>
          <p className="mt-1 text-sm text-ink-400">Clique em "Novo Imóvel" para começar.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-6 py-3 font-medium">Código</th>
                  <th className="px-6 py-3 font-medium">Endereço</th>
                  <th className="px-6 py-3 font-medium">Cidade</th>
                  <th className="px-6 py-3 font-medium">Bairro</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Proprietário</th>
                  <th className="px-6 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const st = propertyStatusStyles[p.status];
                  const owner = getOwner(p.owner_id);
                  return (
                    <tr key={p.id} className="table-row-hover border-b border-ink-50 last:border-0">
                      <td className="px-6 py-3.5 font-mono text-xs font-semibold text-brand-yellow-700">{p.code}</td>
                      <td className="px-6 py-3.5 font-medium text-ink-900">{p.address}{p.number ? `, ${p.number}` : ''}</td>
                      <td className="px-6 py-3.5 text-ink-600">{p.city}</td>
                      <td className="px-6 py-3.5 text-ink-600">{p.district}</td>
                      <td className="px-6 py-3.5"><span className={`badge ${st.badge}`}>{st.label}</span></td>
                      <td className="px-6 py-3.5 text-ink-600">{owner?.name || '—'}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => navigate(`/imoveis/${p.id}`)} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900"><Eye size={16} /></button>
                          <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900"><Pencil size={16} /></button>
                          <button onClick={() => setConfirm(p)} className="rounded-lg p-1.5 text-ink-500 hover:bg-brand-red-50 hover:text-brand-red-600"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setConfirm(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-ink-900">Excluir imóvel?</h3>
            <p className="mt-2 text-sm text-ink-600">O imóvel <span className="font-medium">{confirm.code}</span> ({confirm.address}) e todas as suas ocorrências serão removidos permanentemente.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setConfirm(null)} className="btn-ghost">Cancelar</button>
              <button onClick={() => handleDelete(confirm)} className="btn-danger">Excluir</button>
            </div>
          </div>
        </div>
      )}

      <PropertyFormModal open={formOpen} onClose={() => setFormOpen(false)} property={editProp} />
    </div>
  );
}
