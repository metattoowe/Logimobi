/*
# ImobOccorr — Sistema de Gestão de Ocorrências (schema inicial)

Cria a estrutura completa de tabelas para o sistema de gestão de imóveis,
proprietários e ocorrências, com rastreamento total de eventos na timeline.

## Tabelas criadas

1. `owners` — Proprietários de imóveis
   - id (uuid, PK), name, phone, email, cpf, notes, updated_at, created_at

2. `properties` — Imóveis cadastrados
   - id (uuid, PK), code, address, city, district, status, owner_id (FK owners),
   - type, bedrooms, bathrooms, area, created_at

3. `occurrences` — Ocorrências registradas para cada imóvel
   - id (uuid, PK), property_id (FK properties), title, description, category,
   - responsible, status, priority, date, created_at, updated_at

4. `attachments` — Arquivos anexados às ocorrências (fotos, PDFs, documentos)
   - id (uuid, PK), occurrence_id (FK occurrences), name, kind (photo/pdf/doc/budget),
   - storage_path, mime_type, size_bytes, created_at

5. `comments` — Comentários nas ocorrências
   - id (uuid, PK), occurrence_id (FK occurrences), author, text, created_at

6. `timeline_events` — Eventos automáticos da timeline de cada imóvel
   - id (uuid, PK), property_id (FK properties), occurrence_id (FK occurrences nullable),
   - event_type (occurrence_created, status_changed, comment_added, photo_added,
     document_added, occurrence_edited, occurrence_resolved),
   - title, description, author, metadata (jsonb), created_at

## Segurança (RLS)

- Todas as tabelas têm RLS habilitado.
- Como o app NÃO tem tela de login (MVP de demonstração), as políticas permitem
  leitura e escrita para `anon` e `authenticated` (dados compartilhados/intencionais).
- `USING (true)` é usado apenas porque os dados são intencionalmente públicos.

## Notas

- `timeline_events` é a tabela central do sistema: toda alteração gera um evento.
- `metadata` (jsonb) armazena contexto adicional de cada evento (status antigo/novo, etc.).
- Cascata: excluir um imóvel remove suas ocorrências, anexos, comentários e eventos.
*/

CREATE TABLE IF NOT EXISTS owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text DEFAULT '',
  email text DEFAULT '',
  cpf text DEFAULT '',
  notes text DEFAULT '',
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE owners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_owners" ON owners;
CREATE POLICY "anon_select_owners" ON owners FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_owners" ON owners;
CREATE POLICY "anon_insert_owners" ON owners FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_owners" ON owners;
CREATE POLICY "anon_update_owners" ON owners FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_owners" ON owners;
CREATE POLICY "anon_delete_owners" ON owners FOR DELETE
  TO anon, authenticated USING (true);

-- Properties
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  district text DEFAULT '',
  status text NOT NULL DEFAULT 'Disponível',
  owner_id uuid REFERENCES owners(id) ON DELETE SET NULL,
  type text DEFAULT 'Apartamento',
  bedrooms integer DEFAULT 0,
  bathrooms integer DEFAULT 0,
  area integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_properties" ON properties;
CREATE POLICY "anon_select_properties" ON properties FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_properties" ON properties;
CREATE POLICY "anon_insert_properties" ON properties FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_properties" ON properties;
CREATE POLICY "anon_update_properties" ON properties FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_properties" ON properties;
CREATE POLICY "anon_delete_properties" ON properties FOR DELETE
  TO anon, authenticated USING (true);

-- Occurrences
CREATE TABLE IF NOT EXISTS occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'Outros',
  responsible text DEFAULT '',
  status text NOT NULL DEFAULT 'Aberto',
  priority text NOT NULL DEFAULT 'Média',
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE occurrences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_occurrences" ON occurrences;
CREATE POLICY "anon_select_occurrences" ON occurrences FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_occurrences" ON occurrences;
CREATE POLICY "anon_insert_occurrences" ON occurrences FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_occurrences" ON occurrences;
CREATE POLICY "anon_update_occurrences" ON occurrences FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_occurrences" ON occurrences;
CREATE POLICY "anon_delete_occurrences" ON occurrences FOR DELETE
  TO anon, authenticated USING (true);

-- Attachments
CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id uuid NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'doc',
  storage_path text DEFAULT '',
  mime_type text DEFAULT '',
  size_bytes bigint DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_attachments" ON attachments;
CREATE POLICY "anon_select_attachments" ON attachments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_attachments" ON attachments;
CREATE POLICY "anon_insert_attachments" ON attachments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_attachments" ON attachments;
CREATE POLICY "anon_delete_attachments" ON attachments FOR DELETE
  TO anon, authenticated USING (true);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id uuid NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
  author text NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_comments" ON comments;
CREATE POLICY "anon_select_comments" ON comments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_comments" ON comments;
CREATE POLICY "anon_insert_comments" ON comments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_comments" ON comments;
CREATE POLICY "anon_delete_comments" ON comments FOR DELETE
  TO anon, authenticated USING (true);

-- Timeline events
CREATE TABLE IF NOT EXISTS timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  occurrence_id uuid REFERENCES occurrences(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  author text DEFAULT '',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_timeline_events" ON timeline_events;
CREATE POLICY "anon_select_timeline_events" ON timeline_events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_timeline_events" ON timeline_events;
CREATE POLICY "anon_insert_timeline_events" ON timeline_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_timeline_events" ON timeline_events;
CREATE POLICY "anon_delete_timeline_events" ON timeline_events FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_property_id ON occurrences(property_id);
CREATE INDEX IF NOT EXISTS idx_attachments_occurrence_id ON attachments(occurrence_id);
CREATE INDEX IF NOT EXISTS idx_comments_occurrence_id ON comments(occurrence_id);
CREATE INDEX IF NOT EXISTS idx_timeline_property_id ON timeline_events(property_id);
CREATE INDEX IF NOT EXISTS idx_timeline_occurrence_id ON timeline_events(occurrence_id);
CREATE INDEX IF NOT EXISTS idx_timeline_created_at ON timeline_events(created_at DESC);

-- updated_at trigger for owners
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_owners_updated_at ON owners;
CREATE TRIGGER trigger_owners_updated_at BEFORE UPDATE ON owners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- updated_at trigger for occurrences
DROP TRIGGER IF EXISTS trigger_occurrences_updated_at ON occurrences;
CREATE TRIGGER trigger_occurrences_updated_at BEFORE UPDATE ON occurrences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
