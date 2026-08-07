import { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/store/ToastContext';
import type { Occurrence, Category, Priority } from '@/types';
import { allStatuses } from '@/lib/status';
import { Loader2 } from 'lucide-react';

const categories: Category[] = ['Vazamento', 'Infiltração', 'Elétrica', 'Pintura', 'Limpeza', 'Vistoria', 'Reclamação', 'Jurídico', 'Outros'];
const priorities: Priority[] = ['Baixa', 'Média', 'Alta', 'Urgente'];

interface Props {
  open: boolean;
  onClose: () => void;
  occurrence: Occurrence | null;
}

export function EditOccurrenceModal({ open, onClose, occurrence }: Props) {
  const { updateOccurrence } = useStore();
  const { notify } = useToast();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Vazamento' as Category,
    responsible: '',
    priority: 'Média' as Priority,
    status: 'Aberto' as OccurrenceStatus,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (occurrence) {
      setForm({
        title: occurrence.title,
        description: occurrence.description,
        category: occurrence.category,
        responsible: occurrence.responsible,
        priority: occurrence.priority,
        status: occurrence.status,
      });
    }
  }, [occurrence]);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!occurrence || !form.title.trim()) return;
    setSaving(true);
    try {
      await updateOccurrence(occurrence.id, {
        title: form.title.trim(),
        description: form.description,
        category: form.category,
        responsible: form.responsible,
        priority: form.priority,
        status: form.status,
      });
      notify('Ocorrência editada com sucesso.', 'success');
      onClose();
    } catch {
      notify('Erro ao editar ocorrência.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!occurrence) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar Ocorrência"
      subtitle={occurrence.title}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-ghost" disabled={saving}>Cancelar</button>
          <button onClick={handleSave} className="btn-primary" disabled={saving || !form.title.trim()}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Salvar alterações'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Título</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Categoria</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} className="input">
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Prioridade</label>
          <select value={form.priority} onChange={e => set('priority', e.target.value)} className="input">
            {priorities.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Responsável</label>
          <input value={form.responsible} onChange={e => set('responsible', e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className="input">
            {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Descrição</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="input resize-none" />
        </div>
      </div>
      <p className="mt-4 text-xs text-ink-400">Esta edição será registrada automaticamente na timeline do imóvel.</p>
    </Modal>
  );
}
