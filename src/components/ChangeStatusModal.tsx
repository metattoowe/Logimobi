import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { useStore } from '@/store/StoreContext';
import { useAuth } from '@/store/AuthContext';
import { useToast } from '@/store/ToastContext';
import type { Occurrence, OccurrenceStatus } from '@/types';
import { statusStyles, allStatuses } from '@/lib/status';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  occurrence: Occurrence | null;
}

export function ChangeStatusModal({ open, onClose, occurrence }: Props) {
  const { changeOccurrenceStatus } = useStore();
  const { user } = useAuth();
  const { notify } = useToast();
  const [newStatus, setNewStatus] = useState<OccurrenceStatus>('Em andamento');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  const occStatus = occurrence?.status;
  const author = user?.name || 'Usuário';
  const canSave = comment.trim().length > 0 && newStatus !== occStatus;

  const handleSave = async () => {
    setTouched(true);
    if (!occurrence || !canSave) return;
    setSaving(true);
    try {
      await changeOccurrenceStatus(occurrence.id, newStatus, comment.trim(), author);
      notify('Status atualizado com sucesso.', 'success');
      setComment('');
      setComment('');
      setTouched(false);
      onClose();
    } catch {
      notify('Erro ao alterar status. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setComment('');
    setComment('');
    setTouched(false);
    onClose();
  };

  if (!occurrence) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Alterar Status"
      subtitle={occurrence.title}
      footer={
        <>
          <button onClick={handleClose} className="btn-ghost" disabled={saving}>Cancelar</button>
          <button onClick={handleSave} className="btn-primary" disabled={saving || !canSave}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Salvar alteração'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Status atual</label>
          <div className="flex items-center gap-2">
            <span className={`badge ${statusStyles[occurrence.status].badge}`}>{statusStyles[occurrence.status].label}</span>
          </div>
        </div>

        <div>
          <label className="label">Novo status</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {allStatuses.map(s => {
              const st = statusStyles[s];
              const active = newStatus === s;
              const isCurrent = s === occurrence.status;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNewStatus(s)}
                  disabled={isCurrent}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : isCurrent
                        ? 'border-ink-200 bg-ink-50 text-ink-400 cursor-not-allowed'
                        : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${active ? 'bg-white' : st.dot}`} />
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="label">Responsável</label>
          <input value={author} disabled className="input opacity-60" />
        </div>

        <div>
          <label className="label">Comentário da alteração <span className="text-brand-red-500">*</span></label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            className="input resize-none"
            placeholder="Descreva o motivo da alteração de status..."
          />
          {touched && !comment.trim() && <p className="mt-1 text-xs text-brand-red-500">O comentário é obrigatório.</p>}
        </div>

        <div className="rounded-lg border border-ink-100 bg-ink-50/50 px-3 py-2.5">
          <p className="text-xs text-ink-500">
            <span className="font-medium text-ink-700">Data automática:</span> {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="mt-1 text-xs text-ink-500">Esta alteração será registrada automaticamente na timeline do imóvel.</p>
        </div>
      </div>
    </Modal>
  );
}
