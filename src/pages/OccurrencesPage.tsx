import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/StoreContext';
import { statusStyles, priorityStyles, formatDateBR, formatDateTimeBR, allStatuses, openStatuses } from '@/lib/status';
import { Plus, Search, ClipboardList, Loader2, Clock } from 'lucide-react';
import type { OccurrenceStatus, Category } from '@/types';
import { NewOccurrenceModal } from '@/components/NewOccurrenceModal';
import { useNavigate, useOutletContext } from 'react-router-dom';

interface OutletCtx { search: string }

export function OccurrencesPage() {
  const { search } = useOutletContext<OutletCtx>();
  const { occurrences, properties, loading } = useStore();
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [newOccOpen, setNewOccOpen] = useState(false);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-ink-400" /></div>;
  }

  const categories: Category[] = ['Vazamento', 'Infiltração', 'Elétrica', 'Pintura', 'Limpeza', 'Vistoria', 'Reclamação', 'Jurídico', 'Outros'];

  const q = (search || localSearch).trim().toLowerCase();
  const filtered = [...occurrences]
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
    .filter(o =>
      (!q || o.title.toLowerCase().includes(q) || o.category.toLowerCase().includes(q) || o.status.toLowerCase().includes(q)) &&
      (!statusFilter || o.status === statusFilter) &&
      (!categoryFilter || o.category === categoryFilter)
    );

  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Ocorrências</h1>
          <p className="text-sm text-ink-500">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setNewOccOpen(true)} className="btn-primary"><Plus size={16} /> Nova Ocorrência</button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={localSearch} onChange={e => setLocalSearch(e.target.value)} placeholder="Buscar por título, categoria..." className="input pl-9" />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input min-w-[140px]">
            <option value="">Todas as categorias</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input min-w-[140px]">
            <option value="">Todos os status</option>
            {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card px-6 py-16 text-center">
          <ClipboardList className="mx-auto text-ink-300" size={40} />
          <p className="mt-3 text-sm font-medium text-ink-700">Nenhuma ocorrência registrada</p>
          <p className="mt-1 text-sm text-ink-400">Clique em "Nova Ocorrência" para começar.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-6 py-3 font-medium">Atualizada</th>
                  <th className="px-6 py-3 font-medium">Título</th>
                  <th className="px-6 py-3 font-medium">Categoria</th>
                  <th className="px-6 py-3 font-medium">Prioridade</th>
                  <th className="px-6 py-3 font-medium">Responsável</th>
                  <th className="px-6 py-3 font-medium">Imóvel</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => {
                  const s = statusStyles[o.status];
                  const p = priorityStyles[o.priority];
                  const prop = properties.find(pp => pp.id === o.property_id);
                  const isOverdue = openStatuses.includes(o.status) && new Date(o.date + 'T23:59:59') < today;
                  return (
                    <tr key={o.id} onClick={() => navigate(`/ocorrencias/${o.id}`)} className="table-row-hover cursor-pointer border-b border-ink-50 last:border-0">
                      <td className="px-6 py-3.5 text-ink-600 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          {isOverdue && <Clock size={12} className="text-amber-500" />}
                          {formatDateBR(o.updated_at)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-medium text-ink-900">{o.title}</td>
                      <td className="px-6 py-3.5 text-ink-600">{o.category}</td>
                      <td className="px-6 py-3.5"><span className={`badge ${p.badge}`}>{p.label}</span></td>
                      <td className="px-6 py-3.5 text-ink-600">{o.responsible}</td>
                      <td className="px-6 py-3.5 font-mono text-xs text-ink-600">{prop?.code || '—'}</td>
                      <td className="px-6 py-3.5"><span className={`badge ${s.badge}`}>{s.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <NewOccurrenceModal open={newOccOpen} onClose={() => setNewOccOpen(false)} />
    </div>
  );
}
