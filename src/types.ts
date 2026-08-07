export type PropertyStatus = 'Disponível' | 'Alugado' | 'Em venda' | 'Vendido' | 'Em reforma';
export type OccurrenceStatus =
  | 'Aberto'
  | 'Em andamento'
  | 'Resolvido'
  | 'Aguardando Proprietário'
  | 'Aguardando Inquilino'
  | 'Aguardando Terceiros';
export type Priority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';
export type Category =
  | 'Vazamento'
  | 'Infiltração'
  | 'Elétrica'
  | 'Pintura'
  | 'Limpeza'
  | 'Vistoria'
  | 'Reclamação'
  | 'Jurídico'
  | 'Outros';

export type AttachmentKind = 'photo' | 'pdf' | 'doc' | 'budget';
export type TimelineEventType =
  | 'occurrence_created'
  | 'status_changed'
  | 'comment_added'
  | 'comment_edited'
  | 'comment_deleted'
  | 'photo_added'
  | 'document_added'
  | 'occurrence_edited'
  | 'occurrence_resolved'
  | 'attachment_deleted'
  | 'property_created'
  | 'owner_created'
  | 'tenant_created';

export type UserRole = 'admin' | 'gestor' | 'atendente';

export interface Company {
  id: string;
  name: string;
  slug: string | null;
  phone: string;
  email: string;
  plan: string;
  settings: Record<string, unknown>;
  blocked: boolean;
  max_users: number;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: UserRole;
  email: string;
  name: string;
  is_platform_admin: boolean;
  active: boolean;
  created_at: string;
}

export interface Owner {
  id: string;
  company_id: string;
  name: string;
  phone: string;
  email: string;
  cpf: string;
  notes: string;
  updated_at: string;
  created_at: string;
}

export interface Property {
  id: string;
  company_id: string;
  code: string;
  address: string;
  number: string;
  district: string;
  city: string;
  state: string;
  zip_code: string;
  status: PropertyStatus;
  owner_id: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  tenant_id: string | null;
  created_at: string;
}

export interface Occurrence {
  id: string;
  company_id: string;
  property_id: string;
  title: string;
  description: string;
  category: Category;
  responsible: string;
  status: OccurrenceStatus;
  priority: Priority;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  company_id: string;
  occurrence_id: string;
  name: string;
  kind: AttachmentKind;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export interface Comment {
  id: string;
  company_id: string;
  occurrence_id: string;
  author: string;
  text: string;
  edited: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  company_id: string;
  property_id: string;
  occurrence_id: string | null;
  event_type: TimelineEventType;
  title: string;
  description: string;
  author: string;
  user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Tenant {
  id: string;
  company_id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  entry_date: string | null;
  expected_exit_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ImportJob {
  id: string;
  company_id: string;
  user_id: string | null;
  entity_type: string;
  status: string;
  file_name: string;
  total_rows: number;
  processed_rows: number;
  error_message: string;
  created_at: string;
  updated_at: string;
}

export interface Invite {
  id: string;
  company_id: string;
  email: string;
  role: UserRole;
  token: string;
  used: boolean;
  invited_by: string | null;
  created_at: string;
}
