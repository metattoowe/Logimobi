import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/AuthContext';
import type {
  Owner, Property, Occurrence, Attachment, Comment, TimelineEvent, Tenant,
  TimelineEventType, Category, Priority, OccurrenceStatus, AttachmentKind,
} from '@/types';

interface StoreContextValue {
  owners: Owner[];
  properties: Property[];
  occurrences: Occurrence[];
  attachments: Attachment[];
  comments: Comment[];
  timelineEvents: TimelineEvent[];
  tenants: Tenant[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;

  addOwner: (o: Omit<Owner, 'id' | 'updated_at' | 'created_at' | 'company_id'>) => Promise<Owner | null>;
  updateOwner: (id: string, patch: Partial<Owner>) => Promise<void>;
  deleteOwner: (id: string) => Promise<void>;

  addProperty: (p: Omit<Property, 'id' | 'created_at' | 'company_id'>) => Promise<Property | null>;
  updateProperty: (id: string, patch: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;

  addOccurrence: (o: {
    property_id: string;
    title: string;
    description: string;
    category: Category;
    responsible: string;
    status: OccurrenceStatus;
    priority: Priority;
    date: string;
  }) => Promise<Occurrence | null>;
  updateOccurrence: (id: string, patch: Partial<Occurrence>) => Promise<void>;
  deleteOccurrence: (id: string) => Promise<void>;
  changeOccurrenceStatus: (id: string, newStatus: OccurrenceStatus, comment: string, author: string) => Promise<void>;

  addComment: (occurrenceId: string, author: string, text: string) => Promise<void>;
  updateComment: (id: string, text: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;

  addAttachment: (occurrenceId: string, file: File, kind: AttachmentKind) => Promise<void>;
  deleteAttachment: (id: string) => Promise<void>;
  getAttachmentUrl: (path: string) => Promise<string | null>;

  addTenant: (t: Omit<Tenant, 'id' | 'updated_at' | 'created_at' | 'company_id'>) => Promise<Tenant | null>;
  updateTenant: (id: string, patch: Partial<Tenant>) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  getTenant: (id: string) => Tenant | undefined;
  linkTenantToProperty: (propertyId: string, tenantId: string | null) => Promise<void>;

  getOwner: (id: string) => Owner | undefined;
  getProperty: (id: string) => Property | undefined;
  propertiesByOwner: (ownerId: string) => Property[];
  occurrencesByProperty: (propertyId: string) => Occurrence[];
  attachmentsByOccurrence: (occurrenceId: string) => Attachment[];
  commentsByOccurrence: (occurrenceId: string) => Comment[];
  timelineByProperty: (propertyId: string) => TimelineEvent[];
  timelineByOccurrence: (occurrenceId: string) => TimelineEvent[];
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { session, user } = useAuth();

  const refresh = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [o, p, oc, a, c, te, tn] = await Promise.all([
        supabase.from('owners').select('*').order('created_at', { ascending: false }),
        supabase.from('properties').select('*').order('created_at', { ascending: false }),
        supabase.from('occurrences').select('*').order('updated_at', { ascending: false }),
        supabase.from('attachments').select('*').order('created_at', { ascending: false }),
        supabase.from('comments').select('*').order('created_at', { ascending: false }),
        supabase.from('timeline_events').select('*').order('created_at', { ascending: false }),
        supabase.from('tenants').select('*').order('created_at', { ascending: false }),
      ]);
      if (o.error) throw o.error;
      if (p.error) throw p.error;
      if (oc.error) throw oc.error;
      if (a.error) throw a.error;
      if (c.error) throw c.error;
      if (te.error) throw te.error;
      if (tn.error) throw tn.error;
      setOwners(o.data as Owner[]);
      setProperties(p.data as Property[]);
      setOccurrences(oc.data as Occurrence[]);
      setAttachments(a.data as Attachment[]);
      setComments(c.data as Comment[]);
      setTimelineEvents(te.data as TimelineEvent[]);
      setTenants(tn.data as Tenant[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { refresh(); }, [refresh, session]);

  const authorName = user?.name || 'Sistema';
  const userId = user?.id || null;

  const logTimeline = useCallback(async (event: {
    property_id: string | null;
    occurrence_id?: string | null;
    event_type: TimelineEventType;
    title: string;
    description: string;
    metadata?: Record<string, unknown>;
  }) => {
    const { data, error: err } = await supabase.from('timeline_events').insert({
      property_id: event.property_id,
      occurrence_id: event.occurrence_id || null,
      event_type: event.event_type,
      title: event.title,
      description: event.description,
      author: authorName,
      user_id: userId,
      metadata: event.metadata || {},
    }).select().single();
    if (!err && data) {
      setTimelineEvents(prev => [data as TimelineEvent, ...prev]);
    }
    return data as TimelineEvent | null;
  }, [authorName, userId]);

  // --- Owners ---
  const addOwner = useCallback(async (o: Omit<Owner, 'id' | 'updated_at' | 'created_at' | 'company_id'>) => {
    const { data, error: err } = await supabase.from('owners').insert(o).select().single();
    if (err) throw err;
    if (data) {
      setOwners(prev => [data as Owner, ...prev]);
      await logTimeline({
        property_id: null,
        event_type: 'owner_created',
        title: 'Proprietário cadastrado',
        description: `"${(data as Owner).name}" foi cadastrado no sistema.`,
      });
    }
    return data as Owner;
  }, [logTimeline]);

  const updateOwner = useCallback(async (id: string, patch: Partial<Owner>) => {
    const { data, error: err } = await supabase.from('owners').update(patch).eq('id', id).select().single();
    if (err) throw err;
    if (data) setOwners(prev => prev.map(o => o.id === id ? data as Owner : o));
  }, []);

  const deleteOwner = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('owners').delete().eq('id', id);
    if (err) throw err;
    setOwners(prev => prev.filter(o => o.id !== id));
  }, []);

  // --- Properties ---
  const addProperty = useCallback(async (p: Omit<Property, 'id' | 'created_at' | 'company_id'>) => {
    const payload = { ...p, owner_id: p.owner_id || null, tenant_id: (p as Record<string, unknown>).tenant_id || null };
    const { data, error: err } = await supabase.from('properties').insert(payload).select().single();
    if (err) throw err;
    const prop = data as Property;
    if (prop) {
      setProperties(prev => [prop, ...prev]);
      await logTimeline({
        property_id: prop.id,
        event_type: 'property_created',
        title: 'Imóvel cadastrado',
        description: `Imóvel ${prop.code} — ${prop.address}, ${prop.city} foi cadastrado.`,
      });
    }
    return prop;
  }, [logTimeline]);

  const updateProperty = useCallback(async (id: string, patch: Partial<Property>) => {
    const cleanPatch: Record<string, unknown> = { ...patch };
    if (cleanPatch.owner_id === '') cleanPatch.owner_id = null;
    if (cleanPatch.tenant_id === '') cleanPatch.tenant_id = null;
    const { data, error: err } = await supabase.from('properties').update(cleanPatch).eq('id', id).select().single();
    if (err) throw err;
    if (data) setProperties(prev => prev.map(p => p.id === id ? data as Property : p));
  }, []);

  const deleteProperty = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('properties').delete().eq('id', id);
    if (err) throw err;
    setProperties(prev => prev.filter(p => p.id !== id));
    setOccurrences(prev => prev.filter(o => o.property_id !== id));
    setTimelineEvents(prev => prev.filter(t => t.property_id !== id));
  }, []);

  // --- Occurrences ---
  const addOccurrence = useCallback(async (o: {
    property_id: string;
    title: string;
    description: string;
    category: Category;
    responsible: string;
    status: OccurrenceStatus;
    priority: Priority;
    date: string;
  }) => {
    const { data, error: err } = await supabase.from('occurrences').insert(o).select().single();
    if (err) throw err;
    const occ = data as Occurrence;
    setOccurrences(prev => [occ, ...prev]);
    await logTimeline({
      property_id: o.property_id,
      occurrence_id: occ.id,
      event_type: 'occurrence_created',
      title: 'Ocorrência criada',
      description: `"${o.title}" foi registrada no sistema.`,
      metadata: { status: o.status, category: o.category, priority: o.priority },
    });
    return occ;
  }, [logTimeline]);

  const updateOccurrence = useCallback(async (id: string, patch: Partial<Occurrence>) => {
    const { data, error: err } = await supabase.from('occurrences').update(patch).eq('id', id).select().single();
    if (err) throw err;
    const occ = data as Occurrence;
    setOccurrences(prev => prev.map(o => o.id === id ? occ : o));
    await logTimeline({
      property_id: occ.property_id,
      occurrence_id: occ.id,
      event_type: 'occurrence_edited',
      title: 'Ocorrência editada',
      description: `Dados da ocorrência "${occ.title}" foram atualizados.`,
      metadata: { changes: patch },
    });
  }, [logTimeline]);

  const deleteOccurrence = useCallback(async (id: string) => {
    const occ = occurrences.find(o => o.id === id);
    const { error: err } = await supabase.from('occurrences').delete().eq('id', id);
    if (err) throw err;
    setOccurrences(prev => prev.filter(o => o.id !== id));
    setAttachments(prev => prev.filter(a => a.occurrence_id !== id));
    setComments(prev => prev.filter(c => c.occurrence_id !== id));
    setTimelineEvents(prev => prev.filter(t => t.occurrence_id !== id));
    if (occ) {
      await logTimeline({
        property_id: occ.property_id,
        event_type: 'occurrence_edited',
        title: 'Ocorrência removida',
        description: `A ocorrência "${occ.title}" foi excluída do sistema.`,
      });
    }
  }, [occurrences, logTimeline]);

  const changeOccurrenceStatus = useCallback(async (id: string, newStatus: OccurrenceStatus, commentText: string, author: string) => {
    const occ = occurrences.find(o => o.id === id);
    if (!occ) return;
    const oldStatus = occ.status;
    const { data, error: err } = await supabase.from('occurrences').update({ status: newStatus }).eq('id', id).select().single();
    if (err) throw err;
    const updated = data as Occurrence;
    setOccurrences(prev => prev.map(o => o.id === id ? updated : o));

    const { data: cData, error: cErr } = await supabase.from('comments').insert({
      occurrence_id: id,
      author,
      text: commentText,
      user_id: userId,
    }).select().single();
    if (!cErr && cData) setComments(prev => [cData as Comment, ...prev]);

    const eventType: TimelineEventType = newStatus === 'Resolvido' ? 'occurrence_resolved' : 'status_changed';
    await logTimeline({
      property_id: occ.property_id,
      occurrence_id: id,
      event_type: eventType,
      title: newStatus === 'Resolvido' ? 'Ocorrência concluída' : 'Status alterado',
      description: `Status alterado de "${oldStatus}" para "${newStatus}". ${commentText}`,
      metadata: { old_status: oldStatus, new_status: newStatus, comment: commentText },
    });
  }, [occurrences, logTimeline, userId]);

  // --- Comments ---
  const addComment = useCallback(async (occurrenceId: string, author: string, text: string) => {
    const { data, error: err } = await supabase.from('comments').insert({
      occurrence_id: occurrenceId,
      author,
      text,
      user_id: userId,
    }).select().single();
    if (err) throw err;
    const c = data as Comment;
    setComments(prev => [c, ...prev]);
    const occ = occurrences.find(o => o.id === occurrenceId);
    if (occ) {
      await logTimeline({
        property_id: occ.property_id,
        occurrence_id: occurrenceId,
        event_type: 'comment_added',
        title: 'Comentário adicionado',
        description: `${author} comentou: "${text}"`,
      });
    }
  }, [occurrences, logTimeline, userId]);

  const updateComment = useCallback(async (id: string, text: string) => {
    const { data, error: err } = await supabase.from('comments').update({ text, edited: true }).eq('id', id).select().single();
    if (err) throw err;
    if (data) setComments(prev => prev.map(c => c.id === id ? data as Comment : c));
    const c = data as Comment;
    if (c) {
      const occ = occurrences.find(o => o.id === c.occurrence_id);
      if (occ) {
        await logTimeline({
          property_id: occ.property_id,
          occurrence_id: c.occurrence_id,
          event_type: 'comment_edited',
          title: 'Comentário editado',
          description: `${c.author} editou um comentário.`,
        });
      }
    }
  }, [occurrences, logTimeline]);

  const deleteComment = useCallback(async (id: string) => {
    const c = comments.find(cm => cm.id === id);
    const { error: err } = await supabase.from('comments').delete().eq('id', id);
    if (err) throw err;
    setComments(prev => prev.filter(cm => cm.id !== id));
    if (c) {
      const occ = occurrences.find(o => o.id === c.occurrence_id);
      if (occ) {
        await logTimeline({
          property_id: occ.property_id,
          occurrence_id: c.occurrence_id,
          event_type: 'comment_deleted',
          title: 'Comentário removido',
          description: `${c.author} removeu um comentário.`,
        });
      }
    }
  }, [comments, occurrences, logTimeline]);

  // --- Attachments (with real Storage upload) ---
  const addAttachment = useCallback(async (occurrenceId: string, file: File, kind: AttachmentKind) => {
    const occ = occurrences.find(o => o.id === occurrenceId);
    if (!occ) throw new Error('Ocorrência não encontrada');

    const companyId = occ.company_id;
    const ext = file.name.split('.').pop() || '';
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const storagePath = `${companyId}/${occurrenceId}/${safeName}`;

    const { error: upErr } = await supabase.storage
      .from('attachments')
      .upload(storagePath, file);

    if (upErr) throw upErr;

    const { data, error: dbErr } = await supabase.from('attachments').insert({
      occurrence_id: occurrenceId,
      name: file.name,
      kind,
      storage_path: storagePath,
      mime_type: file.type || '',
      size_bytes: file.size,
    }).select().single();

    if (dbErr) throw dbErr;
    const a = data as Attachment;
    setAttachments(prev => [a, ...prev]);

    const eventType: TimelineEventType = kind === 'photo' ? 'photo_added' : 'document_added';
    await logTimeline({
      property_id: occ.property_id,
      occurrence_id: occurrenceId,
      event_type: eventType,
      title: kind === 'photo' ? 'Foto adicionada' : 'Documento anexado',
      description: `Arquivo "${file.name}" foi anexado à ocorrência "${occ.title}".`,
      metadata: { file_name: file.name, kind },
    });
  }, [occurrences, logTimeline]);

  const deleteAttachment = useCallback(async (id: string) => {
    const att = attachments.find(a => a.id === id);
    if (!att) return;

    if (att.storage_path) {
      await supabase.storage.from('attachments').remove([att.storage_path]);
    }

    const { error: err } = await supabase.from('attachments').delete().eq('id', id);
    if (err) throw err;
    setAttachments(prev => prev.filter(a => a.id !== id));

    const occ = occurrences.find(o => o.id === att.occurrence_id);
    if (occ) {
      await logTimeline({
        property_id: occ.property_id,
        occurrence_id: att.occurrence_id,
        event_type: 'attachment_deleted',
        title: 'Arquivo removido',
        description: `O arquivo "${att.name}" foi removido da ocorrência "${occ.title}".`,
      });
    }
  }, [attachments, occurrences, logTimeline]);

  const getAttachmentUrl = useCallback(async (path: string): Promise<string | null> => {
    const { data } = await supabase.storage.from('attachments').createSignedUrl(path, 3600);
    return data?.signedUrl || null;
  }, []);

  // --- Tenants ---
  const addTenant = useCallback(async (t: Omit<Tenant, 'id' | 'updated_at' | 'created_at' | 'company_id'>) => {
    const { data, error: err } = await supabase.from('tenants').insert(t).select().single();
    if (err) throw err;
    const tenant = data as Tenant;
    if (tenant) {
      setTenants(prev => [tenant, ...prev]);
      await logTimeline({
        property_id: null,
        event_type: 'tenant_created',
        title: 'Inquilino cadastrado',
        description: `"${tenant.name}" foi cadastrado como inquilino.`,
      });
    }
    return tenant;
  }, [logTimeline]);

  const updateTenant = useCallback(async (id: string, patch: Partial<Tenant>) => {
    const { data, error: err } = await supabase.from('tenants').update(patch).eq('id', id).select().single();
    if (err) throw err;
    if (data) setTenants(prev => prev.map(t => t.id === id ? data as Tenant : t));
  }, []);

  const deleteTenant = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('tenants').delete().eq('id', id);
    if (err) throw err;
    setTenants(prev => prev.filter(t => t.id !== id));
    setProperties(prev => prev.map(p => p.tenant_id === id ? { ...p, tenant_id: null } : p));
  }, []);

  const linkTenantToProperty = useCallback(async (propertyId: string, tenantId: string | null) => {
    const { data, error: err } = await supabase.from('properties').update({ tenant_id: tenantId }).eq('id', propertyId).select().single();
    if (err) throw err;
    if (data) setProperties(prev => prev.map(p => p.id === propertyId ? data as Property : p));
  }, []);

  // --- Selectors ---
  const getOwner = useCallback((id: string) => owners.find(o => o.id === id), [owners]);
  const getProperty = useCallback((id: string) => properties.find(p => p.id === id), [properties]);
  const getTenant = useCallback((id: string) => tenants.find(t => t.id === id), [tenants]);
  const propertiesByOwner = useCallback((ownerId: string) => properties.filter(p => p.owner_id === ownerId), [properties]);
  const occurrencesByProperty = useCallback((propertyId: string) => occurrences.filter(o => o.property_id === propertyId), [occurrences]);
  const attachmentsByOccurrence = useCallback((occurrenceId: string) => attachments.filter(a => a.occurrence_id === occurrenceId), [attachments]);
  const commentsByOccurrence = useCallback((occurrenceId: string) => comments.filter(c => c.occurrence_id === occurrenceId), [comments]);
  const timelineByProperty = useCallback((propertyId: string) => timelineEvents.filter(t => t.property_id === propertyId), [timelineEvents]);
  const timelineByOccurrence = useCallback((occurrenceId: string) => timelineEvents.filter(t => t.occurrence_id === occurrenceId), [timelineEvents]);

  const value: StoreContextValue = {
    owners, properties, occurrences, attachments, comments, timelineEvents, tenants,
    loading, error, refresh,
    addOwner, updateOwner, deleteOwner,
    addProperty, updateProperty, deleteProperty,
    addOccurrence, updateOccurrence, deleteOccurrence, changeOccurrenceStatus,
    addComment, updateComment, deleteComment,
    addAttachment, deleteAttachment, getAttachmentUrl,
    addTenant, updateTenant, deleteTenant, getTenant, linkTenantToProperty,
    getOwner, getProperty, propertiesByOwner, occurrencesByProperty,
    attachmentsByOccurrence, commentsByOccurrence, timelineByProperty, timelineByOccurrence,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
