import { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/store/ToastContext';
import type { Comment } from '@/types';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  comment: Comment | null;
}

export function EditCommentModal({ open, onClose, comment }: Props) {
  const { updateComment } = useStore();
  const { notify } = useToast();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (comment) setText(comment.text);
  }, [comment]);

  if (!comment) return null;

  const handleSave = async () => {
    if (!comment || !text.trim()) return;
    setSaving(true);
    try {
      await updateComment(comment.id, text.trim());
      notify('Comentário atualizado com sucesso.', 'success');
      onClose();
    } catch {
      notify('Erro ao editar comentário.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar Comentário"
      subtitle={comment.author}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost" disabled={saving}>Cancelar</button>
          <button onClick={handleSave} className="btn-primary" disabled={saving || !text.trim()}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Salvar alterações'}
          </button>
        </>
      }
    >
      <div>
        <label className="label">Comentário</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={4}
          className="input resize-none"
          placeholder="Edite seu comentário..."
        />
      </div>
    </Modal>
  );
}
