import { useStore } from '@/store/StoreContext';
import { statusStyles } from '@/lib/status';
import { Building2, Users, ClipboardList, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { Category } from '@/types';

export function ReportsPage() {
  const { properties, owners, occurrences, loading } = useStore();

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-ink-400" /></div>;
  }

  const open = occurrences.filter(o => o.status !== 'Resolvido');
  const resolved = occurrences.filter(o => o.status === 'Resolvido');
  const resolutionRate = occurrences.length > 0 ? Math.round((resolved.length / occurrences.length) * 100) : 0;

  const byCategory: Record<string, number> = {};
  occurrences.forEach(o => { byCategory[o.category] = (byCategory[o.category] || 0) + 1; });
  const sortedCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(...sortedCategories.map(c => c[1]), 1);

  const byStatus = Object.entries(statusStyles).map(([key, style]) => ({
    label: style.label,
    badge: style.badge,
    count: occurrences.filter(o => o.status === key).length,
  }));

  const byCity: Record<string, number> = {};
  properties.forEach(p => { byCity[p.city] = (byCity[p.city] || 0) + 1; });
  const sortedCities = Object.entries(byCity).sort((a, b) => b[1] - a[1]);
  const maxCity = Math.max(...sortedCities.map(c => c[1]), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-900">Relatórios</h1>
        <p className="text-sm text-ink-500">Indicadores e estatísticas da operação</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPI icon={Building2} label="Imóveis" value={properties.length} accent="bg-ink-900" />
        <KPI icon={Users} label="Proprietários" value={owners.length} accent="bg-ink-700" />
        <KPI icon={AlertCircle} label="Ocorrências abertas" value={open.length} accent="bg-brand-red-500" />
        <KPI icon={CheckCircle2} label="Taxa de resolução" value={`${resolutionRate}%`} accent="bg-emerald-500" />
      </div>

      {occurrences.length === 0 && properties.length === 0 ? (
        <div className="card px-6 py-16 text-center">
          <ClipboardList className="mx-auto text-ink-300" size={40} />
          <p className="mt-3 text-sm font-medium text-ink-700">Sem dados para relatórios</p>
          <p className="mt-1 text-sm text-ink-400">Cadastre imóveis e ocorrências para visualizar indicadores.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h3 className="text-base font-semibold text-ink-900">Ocorrências por categoria</h3>
            <p className="text-sm text-ink-500">Distribuição dos tipos de ocorrência</p>
            {sortedCategories.length === 0 ? (
              <p className="mt-5 text-sm text-ink-400">Sem dados disponíveis.</p>
            ) : (
              <div className="mt-5 space-y-3">
                {sortedCategories.map(([cat, count]) => (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-700">{cat}</span>
                      <span className="font-medium text-ink-900">{count}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
                      <div className="h-full rounded-full bg-brand-yellow-400 transition-all" style={{ width: `${(count / maxCat) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="text-base font-semibold text-ink-900">Ocorrências por status</h3>
            <p className="text-sm text-ink-500">Situação atual dos registros</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {byStatus.map(s => (
                <div key={s.label} className="rounded-lg border border-ink-100 p-4">
                  <span className={`badge ${s.badge}`}>{s.label}</span>
                  <p className="mt-2 text-2xl font-bold text-ink-900">{s.count}</p>
                </div>
              ))}
            </div>
          </div>

          {sortedCities.length > 0 && (
            <div className="card p-6 lg:col-span-2">
              <h3 className="text-base font-semibold text-ink-900">Imóveis por cidade</h3>
              <p className="text-sm text-ink-500">Distribuição geográfica do portfólio</p>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sortedCities.map(([city, count]) => (
                  <div key={city}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-700">{city}</span>
                      <span className="font-medium text-ink-900">{count} imóvel{count !== 1 ? 'veis' : ''}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
                      <div className="h-full rounded-full bg-ink-700 transition-all" style={{ width: `${(count / maxCity) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function KPI({ icon: Icon, label, value, accent }: { icon: typeof Building2; label: string; value: string | number; accent: string }) {
  return (
    <div className="card p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent} text-white`}>
        <Icon size={20} />
      </div>
      <p className="mt-4 text-2xl font-bold text-ink-900">{value}</p>
      <p className="mt-0.5 text-sm text-ink-500">{label}</p>
    </div>
  );
}
