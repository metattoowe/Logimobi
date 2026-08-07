import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Pencil, MapPin, User, Building2, Bed, Bath, Maximize, Loader2, UserCircle, Eye, X, ExternalLink, FileText } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/store/ToastContext';
import { propertyStatusStyles } from '@/lib/status';
import { Timeline } from '@/components/Timeline';
import { NewOccurrenceModal } from '@/components/NewOccurrenceModal';
import { ChangeStatusModal } from '@/components/ChangeStatusModal';
import { EditOccurrenceModal } from '@/components/EditOccurrenceModal';
import { AddCommentModal } from '@/components/AddCommentModal';
import { AddAttachmentModal } from '@/components/AddAttachmentModal';
import { EditCommentModal } from '@/components/EditCommentModal';
import { PropertyFormModal } from '@/components/PropertyFormModal';
import type { Occurrence, Attachment, Comment, Property } from '@/types';

export function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getProperty, getOwner, getTenant, occurrencesByProperty, timelineByProperty,
    attachmentsByOccurrence, commentsByOccurrence,
    deleteOccurrence, deleteAttachment, deleteComment,
    getAttachmentUrl,
    loading,
  } = useStore();
  const { notify } = useToast();

  const [newOccOpen, setNewOccOpen] = useState(false);
  const [changeStatusOcc, setChangeStatusOcc] = useState<Occurrence | null>(null);
  const [editOcc, setEditOcc] = useState<Occurrence | null>(null);
  const [commentOcc, setCommentOcc] = useState<Occurrence | null>(null);
  const [attachmentState, setAttachmentState] = useState<{ occ: Occurrence; kind: 'photo' | 'doc' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Occurrence | null>(null);
  const [confirmDeleteAtt, setConfirmDeleteAtt] = useState<Attachment | null>(null);
  const [editPropOpen, setEditPropOpen] = useState(false);
  const [editComment, setEditComment] = useState<Comment | null>(null);
  const [confirmDeleteComment, setConfirmDeleteComment] = useState<Comment | null>(null);
  const [previewAtt, setPreviewAtt] = useState<Attachment | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const property = id ? getProperty(id) : undefined;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-ink-400" /></div>;
  }

  if (!property) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-ink-500">Imóvel não encontrado.</p>
        <button onClick={() => navigate('/imoveis')} className="btn-outline mt-4">Voltar</button>
      </div>
    );
  }

  const owner = getOwner(property.owner_id);
  const tenant = property.tenant_id ? getTenant(property.tenant_id) : undefined;
  const st = propertyStatusStyles[property.status];
  const occurrences = occurrencesByProperty(property.id);
  const events = timelineByProperty(property.id);

  const handleDeleteOccurrence = async (occ: Occurrence) => {
    try {
      await deleteOccurrence(occ.id);
      notify('Ocorrência excluída com sucesso.', 'success');
    } catch {
      notify('Erro ao excluir ocorrência.', 'error');
    }
    setConfirmDelete(null);
  };

  const handleDeleteAttachment = async (att: Attachment) => {
    try {
      await deleteAttachment(att.id);
      notify('Arquivo removido com sucesso.', 'success');
    } catch {
      notify('Erro ao remover arquivo.', 'error');
    }
    setConfirmDeleteAtt(null);
  };

  const handleDeleteComment = async (c: Comment) => {
    try {
      await deleteComment(c.id);
      notify('Comentário excluído com sucesso.', 'success');
    } catch {
      notify('Erro ao excluir comentário.', 'error');
    }
    setConfirmDeleteComment(null);
  };

  const handlePreview = async (att: Attachment) => {
    setPreviewAtt(att);
    setPreviewUrl(null);
    setPreviewLoading(true);
    const url = await getAttachmentUrl(att.storage_path);
    setPreviewUrl(url);
    setPreviewLoading(false);
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/imoveis')} className="btn-ghost -ml-2"><ArrowLeft size={16} /> Voltar</button>

      <div className="card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-brand-yellow-700">{property.code}</span>
              <span className={`badge ${st.badge}`}>{st.label}</span>
            </div>
            <h1 className="mt-2 text-xl font-bold text-ink-900">{property.address}{property.number ? `, ${property.number}` : ''}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500"><MapPin size={14} /> {property.district}, {property.city}{property.state ? ` - ${property.state}` : ''}{property.zip_code ? ` · CEP ${property.zip_code}` : ''}</p>
          </div>
          <button onClick={() => setEditPropOpen(true)} className="btn-outline"><Pencil size={16} /> Editar imóvel</button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat icon={Building2} label="Tipo" value={property.type} />
          <Stat icon={Bed} label="Quartos" value={String(property.bedrooms)} />
          <Stat icon={Bath} label="Banheiros" value={String(property.bathrooms)} />
          <Stat icon={Maximize} label="Área" value={`${property.area}m²`} />
          <Stat icon={MapPin} label="Bairro" value={property.district} />
          <Stat icon={User} label="Proprietário" value={owner?.name || '—'} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {owner && (
            <div className="rounded-lg border border-ink-100 bg-ink-50/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Proprietário</p>
              <button onClick={() => navigate(`/proprietarios/${owner.id}`)} className="mt-1.5 flex items-center gap-2 text-left">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-white">{owner.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</span>
                <span className="text-sm font-medium text-ink-900 hover:underline">{owner.name}</span>
                <span className="text-sm text-ink-500">· {owner.phone}</span>
              </button>
            </div>
          )}
          {tenant && (
            <div className="rounded-lg border border-ink-100 bg-ink-50/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Inquilino</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">{tenant.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</span>
                <span className="text-sm font-medium text-ink-900">{tenant.name}</span>
                <span className="text-sm text-ink-500">· {tenant.phone}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <Timeline
        events={events}
        occurrences={occurrences}
        attachmentsByOccurrence={attachmentsByOccurrence}
        commentsByOccurrence={commentsByOccurrence}
        onAdd={() => setNewOccOpen(true)}
        onEditOccurrence={(occ) => setEditOcc(occ)}
        onChangeStatus={(occ) => setChangeStatusOcc(occ)}
        onAddComment={(occ) => setCommentOcc(occ)}
        onAddAttachment={(occ, kind) => setAttachmentState({ occ, kind })}
        onPreviewAttachment={(att) => handlePreview(att)}
        onDeleteAttachment={(att) => setConfirmDeleteAtt(att)}
        onDeleteOccurrence={(occ) => setConfirmDelete(occ)}
        onEditComment={(c) => setEditComment(c)}
        onDeleteComment={(c) => setConfirmDeleteComment(c)}
      />

      <NewOccurrenceModal open={newOccOpen} onClose={() => setNewOccOpen(false)} defaultPropertyId={property.id} />
      <ChangeStatusModal open={!!changeStatusOcc} onClose={() => setChangeStatusOcc(null)} occurrence={changeStatusOcc} />
      <EditOccurrenceModal open={!!editOcc} onClose={() => setEditOcc(null)} occurrence={editOcc} />
      <AddCommentModal open={!!commentOcc} onClose={() => setCommentOcc(null)} occurrence={commentOcc} />
      <AddAttachmentModal
        open={!!attachmentState}
        onClose={() => setAttachmentState(null)}
        occurrence={attachmentState?.occ || null}
        kind={attachmentState?.kind || 'photo'}
      />
      <PropertyFormModal open={editPropOpen} onClose={() => setEditPropOpen(false)} property={property as Property} />
      <EditCommentModal open={!!editComment} onClose={() => setEditComment(null)} comment={editComment} />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-ink-900">Excluir ocorrência?</h3>
            <p className="mt-2 text-sm text-ink-600">A ocorrência <span className="font-medium">{confirmDelete.title}</span> e todos os seus anexos e comentários serão removidos permanentemente.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost">Cancelar</button>
              <button onClick={() => handleDeleteOccurrence(confirmDelete)} className="btn-danger">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteAtt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setConfirmDeleteAtt(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-ink-900">Remover arquivo?</h3>
            <p className="mt-2 text-sm text-ink-600">O arquivo <span className="font-medium">{confirmDeleteAtt.name}</span> será removido permanentemente.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setConfirmDeleteAtt(null)} className="btn-ghost">Cancelar</button>
              <button onClick={() => handleDeleteAttachment(confirmDeleteAtt)} className="btn-danger">Remover</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setConfirmDeleteComment(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-ink-900">Excluir comentário?</h3>
            <p className="mt-2 text-sm text-ink-600">O comentário de <span className="font-medium">{confirmDeleteComment.author}</span> será removido permanentemente.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setConfirmDeleteComment(null)} className="btn-ghost">Cancelar</button>
              <button onClick={() => handleDeleteComment(confirmDeleteComment)} className="btn-danger">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {previewAtt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={() => { setPreviewAtt(null); setPreviewUrl(null); }} />
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <p className="text-sm font-semibold text-ink-900">{previewAtt.name}</p>
              <div className="flex items-center gap-2">
                {previewUrl && (
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm"><ExternalLink size={14} /> Abrir</a>
                )}
                <button onClick={() => { setPreviewAtt(null); setPreviewUrl(null); }} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100"><X size={18} /></button>
              </div>
            </div>
            <div className="flex min-h-[300px] items-center justify-center py-4">
              {previewLoading ? (
                <Loader2 size={24} className="animate-spin text-ink-400" />
              ) : previewUrl ? (
                previewAtt.kind === 'photo' || previewAtt.mime_type.startsWith('image/') ? (
                  <img src={previewUrl} alt={previewAtt.name} className="max-h-[60vh] max-w-full rounded-lg object-contain" />
                ) : previewAtt.mime_type === 'application/pdf' ? (
                  <iframe src={previewUrl} title={previewAtt.name} className="h-[60vh] w-full rounded-lg border border-ink-200" />
                ) : (
                  <div className="text-center">
                    <FileText size={48} className="mx-auto text-ink-300" />
                    <p className="mt-3 text-sm text-ink-500">Pré-visualização não suportada.</p>
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="btn-outline mt-4"><ExternalLink size={14} /> Abrir arquivo</a>
                  </div>
                )
              ) : (
                <p className="text-sm text-ink-400">Não foi possível carregar o arquivo.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Bed; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-100 bg-white p-3">
      <p className="flex items-center gap-1.5 text-xs text-ink-400"><Icon size={13} /> {label}</p>
      <p className="mt-1 text-sm font-semibold text-ink-800 truncate">{value}</p>
    </div>
  );
}
