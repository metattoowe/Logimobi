import type { OccurrenceStatus, Priority, PropertyStatus, TimelineEventType } from '@/types';

export const statusStyles: Record<OccurrenceStatus, { dot: string; badge: string; label: string }> = {
  'Aberto': { dot: 'bg-brand-red-500', badge: 'bg-brand-red-50 text-brand-red-700 border border-brand-red-200', label: 'Aberto' },
  'Em andamento': { dot: 'bg-brand-yellow-400', badge: 'bg-brand-yellow-50 text-brand-yellow-800 border border-brand-yellow-200', label: 'Em andamento' },
  'Aguardando Proprietário': { dot: 'bg-orange-400', badge: 'bg-orange-50 text-orange-700 border border-orange-200', label: 'Aguardando Proprietário' },
  'Aguardando Inquilino': { dot: 'bg-blue-400', badge: 'bg-blue-50 text-blue-700 border border-blue-200', label: 'Aguardando Inquilino' },
  'Aguardando Terceiros': { dot: 'bg-purple-400', badge: 'bg-purple-50 text-purple-700 border border-purple-200', label: 'Aguardando Terceiros' },
  'Resolvido': { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Resolvido' },
};

export const allStatuses: OccurrenceStatus[] = [
  'Aberto',
  'Em andamento',
  'Aguardando Proprietário',
  'Aguardando Inquilino',
  'Aguardando Terceiros',
  'Resolvido',
];

export const openStatuses: OccurrenceStatus[] = [
  'Aberto',
  'Em andamento',
  'Aguardando Proprietário',
  'Aguardando Inquilino',
  'Aguardando Terceiros',
];

export const priorityStyles: Record<Priority, { badge: string; label: string }> = {
  'Baixa': { badge: 'bg-ink-100 text-ink-600 border border-ink-200', label: 'Baixa' },
  'Média': { badge: 'bg-brand-yellow-50 text-brand-yellow-800 border border-brand-yellow-200', label: 'Média' },
  'Alta': { badge: 'bg-orange-50 text-orange-700 border border-orange-200', label: 'Alta' },
  'Urgente': { badge: 'bg-brand-red-50 text-brand-red-700 border border-brand-red-200', label: 'Urgente' },
};

export const propertyStatusStyles: Record<PropertyStatus, { badge: string; label: string }> = {
  'Disponível': { badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Disponível' },
  'Alugado': { badge: 'bg-ink-100 text-ink-700 border border-ink-200', label: 'Alugado' },
  'Em venda': { badge: 'bg-brand-yellow-50 text-brand-yellow-800 border border-brand-yellow-200', label: 'Em venda' },
  'Vendido': { badge: 'bg-ink-50 text-ink-500 border border-ink-200', label: 'Vendido' },
  'Em reforma': { badge: 'bg-orange-50 text-orange-700 border border-orange-200', label: 'Em reforma' },
};

export const timelineEventStyles: Record<TimelineEventType, { dot: string; icon: string; label: string }> = {
  occurrence_created: { dot: 'bg-brand-yellow-400', icon: 'bg-brand-yellow-50 text-brand-yellow-700', label: 'Ocorrência criada' },
  status_changed: { dot: 'bg-ink-400', icon: 'bg-ink-100 text-ink-600', label: 'Status alterado' },
  comment_added: { dot: 'bg-blue-400', icon: 'bg-blue-50 text-blue-600', label: 'Comentário' },
  comment_edited: { dot: 'bg-blue-300', icon: 'bg-blue-50 text-blue-600', label: 'Comentário editado' },
  comment_deleted: { dot: 'bg-brand-red-300', icon: 'bg-brand-red-50 text-brand-red-600', label: 'Comentário removido' },
  photo_added: { dot: 'bg-purple-400', icon: 'bg-purple-50 text-purple-600', label: 'Foto adicionada' },
  document_added: { dot: 'bg-teal-400', icon: 'bg-teal-50 text-teal-600', label: 'Documento anexado' },
  occurrence_edited: { dot: 'bg-ink-500', icon: 'bg-ink-100 text-ink-600', label: 'Ocorrência editada' },
  occurrence_resolved: { dot: 'bg-emerald-500', icon: 'bg-emerald-50 text-emerald-600', label: 'Concluída' },
  attachment_deleted: { dot: 'bg-brand-red-400', icon: 'bg-brand-red-50 text-brand-red-600', label: 'Arquivo removido' },
  property_created: { dot: 'bg-emerald-400', icon: 'bg-emerald-50 text-emerald-600', label: 'Imóvel cadastrado' },
  owner_created: { dot: 'bg-ink-400', icon: 'bg-ink-100 text-ink-600', label: 'Proprietário cadastrado' },
  tenant_created: { dot: 'bg-blue-500', icon: 'bg-blue-50 text-blue-600', label: 'Inquilino cadastrado' },
};

export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

export function formatDateTimeBR(iso: string): string {
  const dt = new Date(iso);
  const d = String(dt.getDate()).padStart(2, '0');
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const y = dt.getFullYear();
  const h = String(dt.getHours()).padStart(2, '0');
  const min = String(dt.getMinutes()).padStart(2, '0');
  return `${d}/${m}/${y} às ${h}:${min}`;
}
