import { useOutletContext, useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2, Plus, Phone, Mail, Loader2, UserCircle, Building2 } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/store/ToastContext';
import { formatDateBR } from '@/lib/status';
import { useState } from 'react';
import type { Tenant } from '@/types';
import { TenantFormModal } from '@/components/TenantFormModal';

interface OutletCtx { search: string }

export function TenantsPage() {
  const { search } = useOutletContext<OutletCtx>();
  const { tenants, properties, deleteTenant, loading } = useStore();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<Tenant | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-ink-400" /></div>;
  }

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.trim().toLowerCase()) ||
    t.cpf.toLowerCase().includes(search.trim().toLowerCase()) ||
    t.email.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleDelete = async (tenant: Tenant) => {
    try {
      await deleteTenant(tenant.id);
      notify('Inquilino excluído com sucesso.', 'success');
    } catch {
      notify('Erro ao excluir inquilino.', 'error');
    }
    setConfirm(null);
  };

  const openEdit = (tenant: Tenant) => {
    setEditTenant(tenant);
    setFormOpen(true);
  };

  const openNew = () => {
    setEditTenant(null);
    setFormOpen(true);
  };

  const propertyForTenant = (tenantId: string) => properties.find(p => p.tenant_id === tenantId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Inquilinos</h1>
          <p className="text-sm text-ink-500">{filtered.length} cadastrado{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={16} /> Novo inquilino</button>
      </div>

      {filtered.length === 0 ? (
        <div className="card px-6 py-16 text-center">
          <UserCircle className="mx-auto text-ink-300" size={40} />
          <p className="mt-3 text-sm font-medium text-ink-700">Nenhum inquilino cadastrado</p>
          <p className="mt-1 text-sm text-ink-400">Clique em "Novo inquilino" para começar.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-6 py-3 font-medium">Nome</th>
                  <th className="px-6 py-3 font-medium">Telefone</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Entrada</th>
                  <th className="px-6 py-3 font-medium">Saída prevista</th>
                  <th className="px-6 py-3 font-medium">Imóvel</th>
                  <th className="px-6 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const prop = propertyForTenant(t.id);
                  return (
                    <tr key={t.id} className="table-row-hover border-b border-ink-50 last:border-0">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-600">{t.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</span>
                          <span className="font-medium text-ink-900">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-ink-600 whitespace-nowrap"><span className="flex items-center gap-1.5"><Phone size={13} className="text-ink-400" />{t.phone}</span></td>
                      <td className="px-6 py-3.5 text-ink-600"><span className="flex items-center gap-1.5"><Mail size={13} className="text-ink-400" /><span className="truncate max-w-[200px]">{t.email}</span></span></td>
                      <td className="px-6 py-3.5 text-ink-600 whitespace-nowrap">{t.entry_date ? formatDateBR(t.entry_date) : '—'}</td>
                      <td className="px-6 py-3.5 text-ink-600 whitespace-nowrap">{t.expected_exit_date ? formatDateBR(t.expected_exit_date) : '—'}</td>
                      <td className="px-6 py-3.5">
                        {prop ? (
                          <button onClick={() => navigate(`/imoveis/${prop.id}`)} className="flex items-center gap-1.5 text-xs font-medium text-brand-yellow-700 hover:underline">
                            <Building2 size={13} /> {prop.code}
                          </button>
                        ) : (
                          <span className="text-ink-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(t)} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900" title="Editar"><Pencil size={16} /></button>
                          <button onClick={() => setConfirm(t)} className="rounded-lg p-1.5 text-ink-500 hover:bg-brand-red-50 hover:text-brand-red-600" title="Excluir"><Trash2 size={16} /></button>
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
            <h3 className="text-base font-semibold text-ink-900">Excluir inquilino?</h3>
            <p className="mt-2 text-sm text-ink-600">Esta ação não pode ser desfeita. O inquilino <span className="font-medium">{confirm.name}</span> será removido permanentemente.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setConfirm(null)} className="btn-ghost">Cancelar</button>
              <button onClick={() => handleDelete(confirm)} className="btn-danger">Excluir</button>
            </div>
          </div>
        </div>
      )}

      <TenantFormModal open={formOpen} onClose={() => setFormOpen(false)} tenant={editTenant} />
    </div>
  );
}
