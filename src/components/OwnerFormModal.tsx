import { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/store/ToastContext';
import type { Owner } from '@/types';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  owner?: Owner | null;
}

const empty = { name: '', cpf: '', phone: '', email: '', notes: '' };

export function OwnerFormModal({ open, onClose, owner }: Props) {
  const { addOwner, updateOwner } = useStore();
  const { notify } = useToast();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (owner) {
      setForm({ name: owner.name, cpf: owner.cpf, phone: owner.phone, email: owner.email, notes: owner.notes });
    } else {
      setForm(empty);
    }
    setTouched(false);
  }, [owner, open]);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!owner;
  const canSave = form.name.trim().length > 0;

  const handleSave = async () => {
    setTouched(true);
    if (!canSave) return;
    setSaving(true);
    try {
      if (isEdit && owner) {
        await updateOwner(owner.id, { ...form, name: form.name.trim() });
        notify('Proprietário atualizado com sucesso.', 'success');
      } else {
        await addOwner({ ...form, name: form.name.trim() });
        notify('Proprietário cadastrado com sucesso.', 'success');
      }
      setForm(empty);
      onClose();
    } catch {
      notify('Erro ao salvar proprietário.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar Proprietário' : 'Novo Proprietário'}
      subtitle={isEdit ? owner!.name : 'Cadastre um novo proprietário'}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost" disabled={saving}>Cancelar</button>
          <button onClick={handleSave} className="btn-primary" disabled={saving || !canSave}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : isEdit ? 'Salvar alterações' : 'Cadastrar'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Nome <span className="text-brand-red-500">*</span></label>
          <input value={form.name} onChange={e => set('name', e.target.value)} className="input" placeholder="Nome completo" />
          {touched && !form.name.trim() && <p className="mt-1 text-xs text-brand-red-500">O nome é obrigatório.</p>}
        </div>
        <div>
          <label className="label">CPF</label>
          <input value={form.cpf} onChange={e => set('cpf', e.target.value)} className="input" placeholder="000.000.000-00" />
        </div>
        <div>
          <label className="label">Telefone</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input" placeholder="(00) 00000-0000" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Email</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input" placeholder="email@exemplo.com" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Observações</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className="input resize-none" placeholder="Notas sobre o proprietário..." />
        </div>
      </div>
    </Modal>
  );
}
