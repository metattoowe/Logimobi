import { useOutletContext, useNavigate } from 'react-router-dom';
import { Building2, Users, AlertCircle, CheckCircle2, ArrowUpRight, Loader2, Clock, CalendarClock, UserCircle } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { statusStyles, priorityStyles, formatDateBR, formatDateTimeBR, timelineEventStyles, openStatuses } from '@/lib/status';

interface OutletCtx { search: string }

export function DashboardPage() {
  const { search } = useOutletContext<OutletCtx>();
  const { properties, owners, occurrences, tenants, timelineEvents, loading } = useStore();
  const navigate = useNavigate();

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-ink-400" /></div>;
  }

  const open = occurrences.filter(o => openStatuses.includes(o.status));
  const resolved = occurrences.filter(o => o.status === 'Resolvido');
  const today = new Date();
  const overdue = open.filter(o => {
    const d = new Date(o.date + 'T23:59:59');
    return d < today;
  });
  const recent = [...occurrences].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1)).slice(0, 8);
  const recentTimeline = [...timelineEvents].slice(0, 6);

  const cards = [
    { label: 'Imóveis cadastrados', value: properties.length, icon: Building2, accent: 'bg-ink-900', trend: properties.length > 0 ? `${properties.length} ativo${properties.length !== 1 ? 's' : ''}` : 'Vazio' },
    { label: 'Proprietários cadastrados', value: owners.length, icon: Users, accent: 'bg-ink-700', trend: owners.length > 0 ? `${owners.length} registrado${owners.length !== 1 ? 's' : ''}` : 'Vazio' },
    { label: 'Inquilinos cadastrados', value: tenants.length, icon: UserCircle, accent: 'bg-blue-600', trend: tenants.length > 0 ? `${tenants.length} ativo${tenants.length !== 1 ? 's' : ''}` : 'Vazio' },
    { label: 'Ocorrências abertas', value: open.length, icon: AlertCircle, accent: 'bg-brand-red-500', trend: open.length > 0 ? 'Requer atenção' : 'Tudo em dia' },
    { label: 'Ocorrências resolvidas', value: resolved.length, icon: CheckCircle2, accent: 'bg-emerald-500', trend: 'Concluídas' },
    { label: 'Ocorrências atrasadas', value: overdue.length, icon: CalendarClock, accent: 'bg-amber-500', trend: overdue.length > 0 ? 'Atenção necessária' : 'Sem atrasos' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-900">Dashboard</h1>
        <p className="text-sm text-ink-500">Visão geral da operação da imobiliária</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(c => (
          <div key={c.label} className="card p-5">
            <div className="flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.accent} text-white`}>
                <c.icon size={20} />
              </div>
              <span className="text-xs font-medium text-ink-400">{c.trend}</span>
            </div>
            <p className="mt-4 text-3xl font-bold text-ink-900">{c.value}</p>
            <p className="mt-0.5 text-sm text-ink-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-0 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
            <div>
              <h3 className="text-base font-semibold text-ink-900">Ocorrências recentes</h3>
              <p className="text-sm text-ink-500">Últimas atualizações no sistema</p>
            </div>
            <button onClick={() => navigate('/ocorrencias')} className="btn-ghost text-sm">Ver todas <ArrowUpRight size={14} /></button>
          </div>
          {recent.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-ink-400">Nenhuma ocorrência registrada ainda.</p>
              <p className="mt-1 text-sm text-ink-400">Crie uma nova ocorrência para vê-la aqui.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                    <th className="px-6 py-3 font-medium">Data</th>
                    <th className="px-6 py-3 font-medium">Título</th>
                    <th className="px-6 py-3 font-medium">Categoria</th>
                    <th className="px-6 py-3 font-medium">Imóvel</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(o => {
                    const prop = properties.find(p => p.id === o.property_id);
                    const s = statusStyles[o.status];
                    const p = priorityStyles[o.priority];
                    const isOverdue = openStatuses.includes(o.status) && new Date(o.date + 'T23:59:59') < today;
                    return (
                      <tr key={o.id} onClick={() => prop && navigate(`/ocorrencias/${o.id}`)} className="table-row-hover cursor-pointer border-b border-ink-50 last:border-0">
                        <td className="px-6 py-3.5 text-ink-600 whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            {isOverdue && <Clock size={12} className="text-amber-500" />}
                            {formatDateBR(o.date)}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-medium text-ink-900">{o.title}</td>
                        <td className="px-6 py-3.5 text-ink-600">{o.category}</td>
                        <td className="px-6 py-3.5 text-ink-600">{prop?.code || '—'}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`badge ${s.badge}`}>{s.label}</span>
                            <span className={`badge ${p.badge}`}>{p.label}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-0">
          <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
            <div>
              <h3 className="text-base font-semibold text-ink-900">Timeline recente</h3>
              <p className="text-sm text-ink-500">Últimas atividades</p>
            </div>
          </div>
          {recentTimeline.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-ink-400">Nenhuma atividade registrada.</p>
            </div>
          ) : (
            <div className="px-6 py-4 space-y-3">
              {recentTimeline.map(ev => {
                const style = timelineEventStyles[ev.event_type];
                return (
                  <div key={ev.id} className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.dot}`}>
                      <span className="h-2 w-2 rounded-full bg-white/90" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-900">{ev.title}</p>
                      <p className="text-xs text-ink-500 truncate">{ev.description}</p>
                      <p className="mt-0.5 text-xs text-ink-400">{formatDateTimeBR(ev.created_at)} · {ev.author}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
