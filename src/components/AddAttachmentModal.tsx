import { useState, useRef } from 'react';
import { Modal } from '@/components/Modal';
import { useStore } from '@/store/StoreContext';
import { useAuth } from '@/store/AuthContext';
import { useToast } from '@/store/ToastContext';
import type { Occurrence, AttachmentKind } from '@/types';
import { Loader2, Upload, FileText, Image as ImageIcon } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  occurrence: Occurrence | null;
  kind: 'photo' | 'doc';
}

const kindMap: Record<'photo' | 'doc', AttachmentKind> = { photo: 'photo', doc: 'doc' };

export function AddAttachmentModal({ open, onClose, occurrence, kind }: Props) {
  const { addAttachment } = useStore();
  const { notify } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setFile(null);
    setDragOver(false);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleSave = async () => {
    if (!occurrence || !file) return;
    setSaving(true);
    try {
      await addAttachment(occurrence.id, file, kindMap[kind]);
      notify(kind === 'photo' ? 'Foto enviada com sucesso.' : 'Documento anexado com sucesso.', 'success');
      setFile(null);
      onClose();
    } catch {
      notify('Erro ao enviar arquivo. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!occurrence) return null;

  const isPhoto = kind === 'photo';

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isPhoto ? 'Adicionar Foto' : 'Anexar Documento'}
      subtitle={occurrence.title}
      footer={
        <>
          <button onClick={handleClose} className="btn-ghost" disabled={saving}>Cancelar</button>
          <button onClick={handleSave} className="btn-primary" disabled={saving || !file}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : isPhoto ? 'Enviar foto' : 'Anexar documento'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
            dragOver ? 'border-ink-400 bg-ink-50' : 'border-ink-200 bg-ink-50/50 hover:border-ink-300 hover:bg-ink-50'
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100">
            {isPhoto ? <ImageIcon size={24} className="text-ink-400" /> : <FileText size={24} className="text-ink-400" />}
          </div>
          {file ? (
            <div className="mt-3 text-center">
              <p className="text-sm font-medium text-ink-900">{file.name}</p>
              <p className="mt-1 text-xs text-ink-400">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
          ) : (
            <>
              <p className="mt-3 text-sm font-medium text-ink-700">Clique ou arraste um arquivo</p>
              <p className="mt-1 text-xs text-ink-400">
                {isPhoto ? 'JPG, PNG, WebP até 10MB' : 'PDF, DOC, XLS até 10MB'}
              </p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={isPhoto ? 'image/*' : '.pdf,.doc,.docx,.xls,.xlsx'}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </Modal>
  );
}
