import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/store/ToastContext';
import type { Category, Priority, OccurrenceStatus } from '@/types';
import { allStatuses } from '@/lib/status';
import { Loader2 } from 'lucide-react';

const categories: Category[] = ['Vazamento', 'Infiltração', 'Elétrica', 'Pintura', 'Limpeza', 'Vistoria', 'Reclamação', 'Jurídico', 'Outros'];
const priorities: Priority[] = ['Baixa', 'Média', 'Alta', 'Urgente'];

interface Props {
  open: boolean;
  onClose: () => void;
  defaultPropertyId?: string;
}

export function NewOccurrenceModal({ open, onClose, defaultPropertyId }: Props) {
  const { properties, addOccurrence } = useStore();
  const { notify } = useToast();
  const [form, setForm] = useState({
    propertyId: defaultPropertyId || properties[0]?.id || '',
    title: '',
    category: 'Vazamento' as Category,
    description: '',
    responsible: '',
    priority: 'Média' as Priority,
    status: 'Aberto' as OccurrenceStatus,
    date: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);
  const [propertyQuery, setPropertyQuery] = useState('');

  const propertyLabel = (propertyId: string): string => {
    const property = properties.find(p => p.id === propertyId);
    return property ? `${property.code} — ${property.address}, ${property.city}` : '';
  };

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.propertyId) return;
    setSaving(true);
    try {
      await addOccurrence({
        property_id: form.propertyId,
        title: form.title.trim(),
        description: form.description,
        category: form.category,
        responsible: form.responsible || 'Não atribuído',
        status: form.status,
        priority: form.priority,
        date: form.date,
      });
      notify('Ocorrência criada com sucesso.', 'success');
      setForm({
        propertyId: defaultPropertyId || properties[0]?.id || '',
        title: '', category: 'Vazamento', description: '', responsible: '',
        priority: 'Média', status: 'Aberto', date: new Date().toISOString().split('T')[0],
      });
      onClose();
    } catch {
      notify('Erro ao criar ocorrência. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova Ocorrência"
      subtitle="Registre um novo acontecimento vinculado a um imóvel"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-ghost" disabled={saving}>Cancelar</button>
          <button onClick={handleSave} className="btn-primary" disabled={saving || !form.title.trim()}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Salvar ocorrência'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Imóvel</label>
          <input
            list="occurrence-property-options"
            value={propertyQuery || propertyLabel(form.propertyId)}
            onChange={e => {
              const query = e.target.value;
              const selected = properties.find(p => propertyLabel(p.id) === query);
              setPropertyQuery(query);
              set('propertyId', selected?.id || '');
            }}
            onFocus={() => setPropertyQuery(propertyLabel(form.propertyId))}
            className="input"
            placeholder="Digite código, endereço ou cidade..."
            autoComplete="off"
          />
          <datalist id="occurrence-property-options">
            {properties.map(p => <option key={p.id} value={propertyLabel(p.id)} />)}
          </datalist>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Título</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} className="input" placeholder="Ex: Vazamento na cozinha" />
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
          <input value={form.responsible} onChange={e => set('responsible', e.target.value)} className="input" placeholder="Nome do responsável" />
        </div>
        <div>
          <label className="label">Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className="input">
            {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Data</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Descrição</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="input resize-none" placeholder="Descreva a ocorrência..." />
        </div>
      </div>
      <p className="mt-4 text-xs text-ink-400">A ocorrência será registrada automaticamente na timeline do imóvel.</p>
    </Modal>
  );
}
