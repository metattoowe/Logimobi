import { useOutletContext, useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2, Plus, Phone, Mail, Loader2, Users } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/store/ToastContext';
import { formatDateBR } from '@/lib/status';
import { useState } from 'react';
import type { Owner } from '@/types';
import { OwnerFormModal } from '@/components/OwnerFormModal';

interface OutletCtx { search: string }

export function OwnersPage() {
  const { search } = useOutletContext<OutletCtx>();
  const { owners, propertiesByOwner, deleteOwner, loading } = useStore();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<Owner | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editOwner, setEditOwner] = useState<Owner | null>(null);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-ink-400" /></div>;
  }

  const filtered = owners.filter(o => o.name.toLowerCase().includes(search.trim().toLowerCase()));

  const handleDelete = async (owner: Owner) => {
    try {
      await deleteOwner(owner.id);
      notify('Proprietário excluído com sucesso.', 'success');
    } catch {
      notify('Erro ao excluir proprietário.', 'error');
    }
    setConfirm(null);
  };

  const openEdit = (owner: Owner) => {
    setEditOwner(owner);
    setFormOpen(true);
  };

  const openNew = () => {
    setEditOwner(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Proprietários</h1>
          <p className="text-sm text-ink-500">{filtered.length} cadastrado{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={16} /> Novo proprietário</button>
      </div>

      {filtered.length === 0 ? (
        <div className="card px-6 py-16 text-center">
          <Users className="mx-auto text-ink-300" size={40} />
          <p className="mt-3 text-sm font-medium text-ink-700">Nenhum proprietário cadastrado</p>
          <p className="mt-1 text-sm text-ink-400">Clique em "Novo proprietário" para começar.</p>
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
                  <th className="px-6 py-3 font-medium">Imóveis</th>
                  <th className="px-6 py-3 font-medium">Última atualização</th>
                  <th className="px-6 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className="table-row-hover border-b border-ink-50 last:border-0">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-600">{o.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</span>
                        <span className="font-medium text-ink-900">{o.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-ink-600 whitespace-nowrap"><span className="flex items-center gap-1.5"><Phone size={13} className="text-ink-400" />{o.phone}</span></td>
                    <td className="px-6 py-3.5 text-ink-600"><span className="flex items-center gap-1.5"><Mail size={13} className="text-ink-400" /><span className="truncate max-w-[200px]">{o.email}</span></span></td>
                    <td className="px-6 py-3.5"><span className="badge border border-ink-200 bg-ink-50 text-ink-700">{propertiesByOwner(o.id).length}</span></td>
                    <td className="px-6 py-3.5 text-ink-600 whitespace-nowrap">{formatDateBR(o.updated_at)}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/proprietarios/${o.id}`)} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900" title="Visualizar"><Eye size={16} /></button>
                        <button onClick={() => openEdit(o)} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900" title="Editar"><Pencil size={16} /></button>
                        <button onClick={() => setConfirm(o)} className="rounded-lg p-1.5 text-ink-500 hover:bg-brand-red-50 hover:text-brand-red-600" title="Excluir"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setConfirm(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-ink-900">Excluir proprietário?</h3>
            <p className="mt-2 text-sm text-ink-600">Esta ação não pode ser desfeita. O proprietário <span className="font-medium">{confirm.name}</span> será removido permanentemente.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setConfirm(null)} className="btn-ghost">Cancelar</button>
              <button onClick={() => handleDelete(confirm)} className="btn-danger">Excluir</button>
            </div>
          </div>
        </div>
      )}

      <OwnerFormModal open={formOpen} onClose={() => setFormOpen(false)} owner={editOwner} />
    </div>
  );
}
