import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { useStore } from '@/store/StoreContext';
import { useAuth } from '@/store/AuthContext';
import { useToast } from '@/store/ToastContext';
import type { Occurrence } from '@/types';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  occurrence: Occurrence | null;
}

export function AddCommentModal({ open, onClose, occurrence }: Props) {
  const { addComment } = useStore();
  const { user } = useAuth();
  const { notify } = useToast();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  const canSave = text.trim().length > 0;

  const handleSave = async () => {
    setTouched(true);
    if (!occurrence || !canSave) return;
    setSaving(true);
    try {
      await addComment(occurrence.id, user?.name || 'Usuário', text.trim());
      notify('Comentário salvo com sucesso.', 'success');
      setText('');
      setTouched(false);
      onClose();
    } catch {
      notify('Erro ao salvar comentário.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setText('');
    setTouched(false);
    onClose();
  };

  if (!occurrence) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Adicionar Comentário"
      subtitle={occurrence.title}
      footer={
        <>
          <button onClick={handleClose} className="btn-ghost" disabled={saving}>Cancelar</button>
          <button onClick={handleSave} className="btn-primary" disabled={saving || !canSave}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Salvar comentário'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Autor</label>
          <input value={user?.name || ''} disabled className="input opacity-60" />
        </div>
        <div>
          <label className="label">Comentário <span className="text-brand-red-500">*</span></label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={4}
            className="input resize-none"
            placeholder="Escreva seu comentário..."
          />
          {touched && !text.trim() && <p className="mt-1 text-xs text-brand-red-500">O comentário não pode estar vazio.</p>}
        </div>
        <div className="rounded-lg border border-ink-100 bg-ink-50/50 px-3 py-2.5">
          <p className="text-xs text-ink-500">
            <span className="font-medium text-ink-700">Registrado em:</span> {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="mt-1 text-xs text-ink-500">O comentário aparecerá na timeline em ordem cronológica.</p>
        </div>
      </div>
    </Modal>
  );
}
