import { useState } from 'react';
import type { TimelineEvent, Occurrence, Attachment, Comment } from '@/types';
import { timelineEventStyles, statusStyles, formatDateBR, formatDateTimeBR } from '@/lib/status';
import {
  Calendar, User, MessageSquare, Paperclip, Image as ImageIcon, FileText,
  ChevronDown, ChevronUp, Plus, CheckCircle2, Edit3, Trash2, MessageCircle, Pencil, Eye,
} from 'lucide-react';

interface TimelineProps {
  events: TimelineEvent[];
  occurrences: Occurrence[];
  attachmentsByOccurrence: (id: string) => Attachment[];
  commentsByOccurrence: (id: string) => Comment[];
  onAdd?: () => void;
  onEditOccurrence?: (occ: Occurrence) => void;
  onChangeStatus?: (occ: Occurrence) => void;
  onAddComment?: (occ: Occurrence) => void;
  onAddAttachment?: (occ: Occurrence, kind: 'photo' | 'doc') => void;
  onPreviewAttachment?: (att: Attachment) => void;
  onDeleteAttachment?: (att: Attachment) => void;
  onDeleteOccurrence?: (occ: Occurrence) => void;
  onEditComment?: (comment: Comment) => void;
  onDeleteComment?: (comment: Comment) => void;
}

export function Timeline({
  events, occurrences, attachmentsByOccurrence, commentsByOccurrence,
  onAdd, onEditOccurrence, onChangeStatus, onAddComment, onAddAttachment,
  onPreviewAttachment, onDeleteAttachment, onDeleteOccurrence, onEditComment, onDeleteComment,
}: TimelineProps) {
  const sorted = [...events].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return (
    <div className="card p-0">
      <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
        <div>
          <h3 className="text-base font-semibold text-ink-900">Timeline do Imóvel</h3>
          <p className="text-sm text-ink-500">{sorted.length} evento{sorted.length !== 1 ? 's' : ''} registrado{sorted.length !== 1 ? 's' : ''}</p>
        </div>
        {onAdd && (
          <button onClick={onAdd} className="btn-brand text-sm"><Plus size={16} /> Nova ocorrência</button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink-100">
            <Calendar size={24} className="text-ink-400" />
          </div>
          <p className="mt-3 text-sm font-medium text-ink-700">Nenhum evento registrado</p>
          <p className="mt-1 text-sm text-ink-400">Este imóvel ainda não possui acontecimentos no histórico.</p>
        </div>
      ) : (
        <div className="px-6 py-6">
          <div className="relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-ink-200" />
            <div className="space-y-1">
              {sorted.map(ev => (
                <TimelineItem
                  key={ev.id}
                  event={ev}
                  occurrences={occurrences}
                  attachmentsByOccurrence={attachmentsByOccurrence}
                  commentsByOccurrence={commentsByOccurrence}
                  onEditOccurrence={onEditOccurrence}
                  onChangeStatus={onChangeStatus}
                  onAddComment={onAddComment}
                  onAddAttachment={onAddAttachment}
                  onPreviewAttachment={onPreviewAttachment}
                  onDeleteAttachment={onDeleteAttachment}
                  onDeleteOccurrence={onDeleteOccurrence}
                  onEditComment={onEditComment}
                  onDeleteComment={onDeleteComment}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineItem({
  event, occurrences, attachmentsByOccurrence, commentsByOccurrence,
  onEditOccurrence, onChangeStatus, onAddComment, onAddAttachment, onDeleteAttachment, onDeleteOccurrence,
  onEditComment, onDeleteComment,
}: {
  event: TimelineEvent;
  occurrences: Occurrence[];
  attachmentsByOccurrence: (id: string) => Attachment[];
  commentsByOccurrence: (id: string) => Comment[];
  onEditOccurrence?: (occ: Occurrence) => void;
  onChangeStatus?: (occ: Occurrence) => void;
  onAddComment?: (occ: Occurrence) => void;
  onAddAttachment?: (occ: Occurrence, kind: 'photo' | 'doc') => void;
  onPreviewAttachment?: (att: Attachment) => void;
  onDeleteAttachment?: (att: Attachment) => void;
  onDeleteOccurrence?: (occ: Occurrence) => void;
  onEditComment?: (comment: Comment) => void;
  onDeleteComment?: (comment: Comment) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const style = timelineEventStyles[event.event_type];
  const occ = event.occurrence_id ? occurrences.find(o => o.id === event.occurrence_id) : undefined;
  const attachments = occ ? attachmentsByOccurrence(occ.id) : [];
  const comments = occ ? commentsByOccurrence(occ.id) : [];
  const hasDetails = !!occ || attachments.length > 0 || comments.length > 0;

  return (
    <div className="relative pl-10 pb-6">
      <div className={`absolute left-0 top-1.5 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white ${style.dot}`}>
        <span className="h-2.5 w-2.5 rounded-full bg-white/90" />
      </div>

      <div className="rounded-xl border border-ink-200 bg-white transition-shadow hover:shadow-soft">
        {/* Event header */}
        <div className="flex items-start gap-3 px-5 py-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${style.icon} border border-transparent`}>{style.label}</span>
              {occ && <span className={`badge ${statusStyles[occ.status].badge}`}>{statusStyles[occ.status].label}</span>}
              {event.author && <span className="text-xs text-ink-400">por {event.author}</span>}
            </div>
            <h4 className="mt-2 text-sm font-semibold text-ink-900">{event.title}</h4>
            <p className="mt-1 text-sm text-ink-600">{event.description}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-400">
              <span className="flex items-center gap-1"><Calendar size={12} /> {formatDateTimeBR(event.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Occurrence details (expandable) */}
        {hasDetails && occ && (
          <>
            <div className="border-t border-ink-100 px-5 py-2">
              <button
                onClick={() => setExpanded(e => !e)}
                className="flex w-full items-center justify-between py-1 text-sm font-medium text-ink-600 hover:text-ink-900"
              >
                Ver detalhes da ocorrência
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {expanded && (
              <div className="border-t border-ink-100 px-5 py-4 space-y-4">
                {/* Occurrence info */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-ink-900">{occ.title}</span>
                    <span className="badge border border-ink-200 bg-ink-50 text-ink-600">{occ.category}</span>
                  </div>
                  <p className="text-sm text-ink-600">{occ.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                    <span className="flex items-center gap-1"><User size={12} /> {occ.responsible}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> {formatDateBR(occ.date)}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {onChangeStatus && (
                    <button onClick={() => onChangeStatus(occ)} className="btn-outline text-xs">
                      <Edit3 size={14} /> Alterar Status
                    </button>
                  )}
                  {onEditOccurrence && (
                    <button onClick={() => onEditOccurrence(occ)} className="btn-outline text-xs">
                      <Edit3 size={14} /> Editar
                    </button>
                  )}
                  {onAddComment && (
                    <button onClick={() => onAddComment(occ)} className="btn-outline text-xs">
                      <MessageCircle size={14} /> Comentar
                    </button>
                  )}
                  {onAddAttachment && (
                    <>
                      <button onClick={() => onAddAttachment(occ, 'photo')} className="btn-outline text-xs">
                        <ImageIcon size={14} /> Adicionar foto
                      </button>
                      <button onClick={() => onAddAttachment(occ, 'doc')} className="btn-outline text-xs">
                        <FileText size={14} /> Anexar documento
                      </button>
                    </>
                  )}
                  {onDeleteOccurrence && (
                    <button onClick={() => onDeleteOccurrence(occ)} className="btn-ghost text-xs text-brand-red-600 hover:bg-brand-red-50">
                      <Trash2 size={14} /> Excluir
                    </button>
                  )}
                </div>

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                      <Paperclip size={13} /> Anexos ({attachments.length})
                    </p>
                    <div className="space-y-1.5">
                      {attachments.map(a => (
                        <div key={a.id} className="flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 px-3 py-2">
                          {a.kind === 'photo' ? <ImageIcon size={14} className="text-brand-yellow-700" /> : <FileText size={14} className="text-ink-500" />}
                          <span className="text-sm text-ink-700">{a.name}</span>
                          <span className="text-xs text-ink-400">{(a.size_bytes / 1024).toFixed(0)} KB</span>
                          {onPreviewAttachment && (
                            <button onClick={() => onPreviewAttachment(a)} className="rounded p-1 text-ink-400 hover:bg-ink-200 hover:text-ink-700" title="Visualizar">
                              <Eye size={14} />
                            </button>
                          )}
                          {onDeleteAttachment && (
                            <button onClick={() => onDeleteAttachment(a)} className="ml-auto rounded p-1 text-ink-400 hover:bg-brand-red-50 hover:text-brand-red-600" title="Excluir">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                {comments.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                      <MessageSquare size={13} /> Comentários ({comments.length})
                    </p>
                    <div className="space-y-2">
                      {[...comments].sort((a, b) => (a.created_at < b.created_at ? -1 : 1)).map(c => (
                        <div key={c.id} className="rounded-lg bg-ink-50 px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-200 text-[10px] font-semibold text-ink-600">
                              {c.author.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </span>
                            <span className="text-xs font-semibold text-ink-700">{c.author}</span>
                            {c.edited && <span className="text-[10px] text-ink-400">(editado)</span>}
                            <span className="text-xs text-ink-400">{formatDateTimeBR(c.created_at)}</span>
                            <div className="ml-auto flex items-center gap-1">
                              {onEditComment && (
                                <button onClick={() => onEditComment(c)} className="rounded p-1 text-ink-400 hover:bg-ink-200 hover:text-ink-700" title="Editar">
                                  <Pencil size={12} />
                                </button>
                              )}
                              {onDeleteComment && (
                                <button onClick={() => onDeleteComment(c)} className="rounded p-1 text-ink-400 hover:bg-brand-red-50 hover:text-brand-red-600" title="Excluir">
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="mt-1.5 pl-8 text-sm text-ink-600">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
