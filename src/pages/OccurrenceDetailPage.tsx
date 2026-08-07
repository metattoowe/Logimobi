import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeft, Pencil, Trash2, Eye, MessageCircle, Image as ImageIcon, FileText,
  Calendar, User, Building2, X, Loader2, ExternalLink,
} from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useAuth } from '@/store/AuthContext';
import { useToast } from '@/store/ToastContext';
import { statusStyles, priorityStyles, formatDateBR, formatDateTimeBR, timelineEventStyles } from '@/lib/status';
import { ChangeStatusModal } from '@/components/ChangeStatusModal';
import { EditOccurrenceModal } from '@/components/EditOccurrenceModal';
import { AddCommentModal } from '@/components/AddCommentModal';
import { AddAttachmentModal } from '@/components/AddAttachmentModal';
import { EditCommentModal } from '@/components/EditCommentModal';
import type { Occurrence, Attachment, Comment } from '@/types';

export function OccurrenceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useToast();
  const {
    getProperty, getOwner, occurrences, attachmentsByOccurrence, commentsByOccurrence, timelineByOccurrence,
    deleteOccurrence, deleteAttachment, deleteComment, getAttachmentUrl, loading,
  } = useStore();

  const [changeStatusOcc, setChangeStatusOcc] = useState<Occurrence | null>(null);
  const [editOcc, setEditOcc] = useState<Occurrence | null>(null);
  const [commentOcc, setCommentOcc] = useState<Occurrence | null>(null);
  const [attachmentState, setAttachmentState] = useState<{ occ: Occurrence; kind: 'photo' | 'doc' } | null>(null);
  const [editComment, setEditComment] = useState<Comment | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteAtt, setConfirmDeleteAtt] = useState<Attachment | null>(null);
  const [confirmDeleteComment, setConfirmDeleteComment] = useState<Comment | null>(null);
  const [previewAtt, setPreviewAtt] = useState<Attachment | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const occ = occurrences.find(o => o.id === id);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-ink-400" /></div>;
  }

  if (!occ) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-ink-500">Ocorrência não encontrada.</p>
        <button onClick={() => navigate('/ocorrencias')} className="btn-outline mt-4">Voltar</button>
      </div>
    );
  }

  const property = getProperty(occ.property_id);
  const owner = property ? getOwner(property.owner_id) : undefined;
  const s = statusStyles[occ.status];
  const p = priorityStyles[occ.priority];
  const attachments = attachmentsByOccurrence(occ.id);
  const comments = commentsByOccurrence(occ.id);
  const events = timelineByOccurrence(occ.id);
  const photos = attachments.filter(a => a.kind === 'photo');
  const docs = attachments.filter(a => a.kind !== 'photo');

  const handlePreview = async (att: Attachment) => {
    setPreviewAtt(att);
    setPreviewUrl(null);
    setPreviewLoading(true);
    const url = await getAttachmentUrl(att.storage_path);
    setPreviewUrl(url);
    setPreviewLoading(false);
  };

  const handleDeleteOccurrence = async () => {
    try {
      await deleteOccurrence(occ.id);
      notify('Ocorrência excluída com sucesso.', 'success');
      navigate('/ocorrencias');
    } catch {
      notify('Erro ao excluir ocorrência.', 'error');
    }
    setConfirmDelete(false);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => navigate('/ocorrencias')} className="btn-ghost -ml-2"><ArrowLeft size={16} /> Voltar</button>
        {property && (
          <button onClick={() => navigate(`/imoveis/${property.id}`)} className="btn-outline">
            <Building2 size={16} /> Ver Imóvel
          </button>
        )}
      </div>

      {/* Occurrence header */}
      <div className="card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${s.badge}`}>{s.label}</span>
              <span className={`badge ${p.badge}`}>{p.label}</span>
              <span className="badge border border-ink-200 bg-ink-50 text-ink-600">{occ.category}</span>
            </div>
            <h1 className="mt-2 text-xl font-bold text-ink-900">{occ.title}</h1>
            <p className="mt-2 text-sm text-ink-600">{occ.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-ink-500">
              <span className="flex items-center gap-1"><User size={12} /> {occ.responsible}</span>
              <span className="flex items-center gap-1"><Calendar size={12} /> Aberta em {formatDateBR(occ.date)}</span>
              <span>Atualizada em {formatDateTimeBR(occ.updated_at)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setChangeStatusOcc(occ)} className="btn-outline text-sm"><Pencil size={14} /> Alterar Status</button>
            <button onClick={() => setEditOcc(occ)} className="btn-outline text-sm"><Pencil size={14} /> Editar</button>
            <button onClick={() => setCommentOcc(occ)} className="btn-outline text-sm"><MessageCircle size={14} /> Comentar</button>
            <button onClick={() => setAttachmentState({ occ, kind: 'photo' })} className="btn-outline text-sm"><ImageIcon size={14} /> Foto</button>
            <button onClick={() => setAttachmentState({ occ, kind: 'doc' })} className="btn-outline text-sm"><FileText size={14} /> Anexo</button>
            <button onClick={() => setConfirmDelete(true)} className="btn-ghost text-sm text-brand-red-600 hover:bg-brand-red-50"><Trash2 size={14} /> Excluir</button>
          </div>
        </div>

        {property && (
          <div className="mt-6 rounded-lg border border-ink-100 bg-ink-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Imóvel vinculado</p>
            <button onClick={() => navigate(`/imoveis/${property.id}`)} className="mt-1.5 flex items-center gap-2 text-left">
              <span className="font-mono text-sm font-semibold text-brand-yellow-700">{property.code}</span>
              <span className="text-sm font-medium text-ink-900 hover:underline">{property.address}, {property.city}</span>
              {owner && <span className="text-sm text-ink-500">· {owner.name}</span>}
            </button>
          </div>
        )}
      </div>

      {/* Photos grid */}
      {photos.length > 0 && (
        <div className="card p-0">
          <div className="border-b border-ink-100 px-6 py-3">
            <h3 className="text-sm font-semibold text-ink-700">Fotos ({photos.length})</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map(a => (
              <div key={a.id} className="group relative overflow-hidden rounded-lg border border-ink-200 bg-ink-50">
                <button onClick={() => handlePreview(a)} className="flex h-32 w-full items-center justify-center text-ink-400 hover:bg-ink-100">
                  <ImageIcon size={24} />
                </button>
                <div className="border-t border-ink-100 px-2 py-1.5">
                  <p className="truncate text-xs text-ink-600">{a.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-ink-400">{(a.size_bytes / 1024).toFixed(0)} KB</span>
                    <div className="flex gap-1">
                      <button onClick={() => handlePreview(a)} className="rounded p-1 text-ink-400 hover:bg-ink-200 hover:text-ink-700" title="Visualizar">
                        <Eye size={12} />
                      </button>
                      <button onClick={() => setConfirmDeleteAtt(a)} className="rounded p-1 text-ink-400 hover:bg-brand-red-50 hover:text-brand-red-600" title="Excluir">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      {docs.length > 0 && (
        <div className="card p-0">
          <div className="border-b border-ink-100 px-6 py-3">
            <h3 className="text-sm font-semibold text-ink-700">Documentos e Anexos ({docs.length})</h3>
          </div>
          <div className="divide-y divide-ink-50">
            {docs.map(a => (
              <div key={a.id} className="flex items-center gap-3 px-6 py-3">
                <FileText size={16} className="text-ink-500" />
                <span className="text-sm text-ink-700">{a.name}</span>
                <span className="text-xs text-ink-400">{(a.size_bytes / 1024).toFixed(0)} KB</span>
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={() => handlePreview(a)} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900" title="Visualizar">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => setConfirmDeleteAtt(a)} className="rounded-lg p-1.5 text-ink-500 hover:bg-brand-red-50 hover:text-brand-red-600" title="Excluir">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="card p-0">
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-3">
          <h3 className="text-sm font-semibold text-ink-700">Comentários ({comments.length})</h3>
          <button onClick={() => setCommentOcc(occ)} className="btn-ghost text-sm"><MessageCircle size={14} /> Adicionar</button>
        </div>
        {comments.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-ink-400">Nenhum comentário ainda.</div>
        ) : (
          <div className="divide-y divide-ink-50">
            {[...comments].sort((a, b) => (a.created_at < b.created_at ? -1 : 1)).map(c => (
              <div key={c.id} className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-200 text-[10px] font-semibold text-ink-600">
                    {c.author.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </span>
                  <span className="text-xs font-semibold text-ink-700">{c.author}</span>
                  {c.edited && <span className="text-[10px] text-ink-400">(editado)</span>}
                  <span className="text-xs text-ink-400">{formatDateTimeBR(c.created_at)}</span>
                  <div className="ml-auto flex items-center gap-1">
                    {c.user_id === user?.id && (
                      <button onClick={() => setEditComment(c)} className="rounded p-1 text-ink-400 hover:bg-ink-200 hover:text-ink-700" title="Editar">
                        <Pencil size={12} />
                      </button>
                    )}
                    {c.user_id === user?.id && (
                      <button onClick={() => setConfirmDeleteComment(c)} className="rounded p-1 text-ink-400 hover:bg-brand-red-50 hover:text-brand-red-600" title="Excluir">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-1.5 pl-9 text-sm text-ink-600">{c.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Occurrence-only timeline */}
      <div className="card p-0">
        <div className="border-b border-ink-100 px-6 py-4">
          <h3 className="text-base font-semibold text-ink-900">Timeline da Ocorrência</h3>
          <p className="text-sm text-ink-500">{events.length} evento{events.length !== 1 ? 's' : ''}</p>
        </div>
        {events.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-ink-400">Nenhum evento registrado para esta ocorrência.</div>
        ) : (
          <div className="px-6 py-6">
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-ink-200" />
              <div className="space-y-1">
                {[...events].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).map(ev => {
                  const style = timelineEventStyles[ev.event_type];
                  return (
                    <div key={ev.id} className="relative pl-10 pb-6">
                      <div className={`absolute left-0 top-1.5 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white ${style.dot}`}>
                        <span className="h-2.5 w-2.5 rounded-full bg-white/90" />
                      </div>
                      <div className="rounded-xl border border-ink-200 bg-white px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`badge ${style.icon} border border-transparent`}>{style.label}</span>
                          {ev.author && <span className="text-xs text-ink-400">por {ev.author}</span>}
                        </div>
                        <h4 className="mt-2 text-sm font-semibold text-ink-900">{ev.title}</h4>
                        <p className="mt-1 text-sm text-ink-600">{ev.description}</p>
                        <p className="mt-1.5 text-xs text-ink-400">{formatDateTimeBR(ev.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ChangeStatusModal open={!!changeStatusOcc} onClose={() => setChangeStatusOcc(null)} occurrence={changeStatusOcc} />
      <EditOccurrenceModal open={!!editOcc} onClose={() => setEditOcc(null)} occurrence={editOcc} />
      <AddCommentModal open={!!commentOcc} onClose={() => setCommentOcc(null)} occurrence={commentOcc} />
      <AddAttachmentModal open={!!attachmentState} onClose={() => setAttachmentState(null)} occurrence={attachmentState?.occ || null} kind={attachmentState?.kind || 'photo'} />
      <EditCommentModal open={!!editComment} onClose={() => setEditComment(null)} comment={editComment} />

      {/* Preview modal */}
      {previewAtt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={() => { setPreviewAtt(null); setPreviewUrl(null); }} />
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <p className="text-sm font-semibold text-ink-900">{previewAtt.name}</p>
              <div className="flex items-center gap-2">
                {previewUrl && (
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm">
                    <ExternalLink size={14} /> Abrir em nova aba
                  </a>
                )}
                <button onClick={() => { setPreviewAtt(null); setPreviewUrl(null); }} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100">
                  <X size={18} />
                </button>
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
                    <p className="mt-3 text-sm text-ink-500">Pré-visualização não suportada para este tipo de arquivo.</p>
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="btn-outline mt-4">
                      <ExternalLink size={14} /> Abrir arquivo
                    </a>
                  </div>
                )
              ) : (
                <p className="text-sm text-ink-400">Não foi possível carregar o arquivo.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete occurrence confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setConfirmDelete(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-ink-900">Excluir ocorrência?</h3>
            <p className="mt-2 text-sm text-ink-600">A ocorrência <span className="font-medium">{occ.title}</span> e todos os seus anexos e comentários serão removidos permanentemente.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(false)} className="btn-ghost">Cancelar</button>
              <button onClick={handleDeleteOccurrence} className="btn-danger">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete attachment confirmation */}
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

      {/* Delete comment confirmation */}
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
    </div>
  );
}
