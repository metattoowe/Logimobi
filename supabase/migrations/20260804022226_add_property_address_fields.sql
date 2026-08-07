/*
# Add address detail columns to properties

1. Modified Tables
- `properties`: adds `number` (text), `state` (text), `zip_code` (text)
  These complement the existing `address`, `city`, `district` fields to support
  the full imóvel form: Endereço, Número, Bairro, Cidade, Estado, CEP.

2. Security
- No policy changes. Existing anon/authenticated CRUD policies already cover these columns.

3. Notes
- All new columns are nullable with sensible defaults so existing rows remain valid.
- `number` stores the street number as text (some addresses use "123-A" style).
*/

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS state text DEFAULT '',
  ADD COLUMN IF NOT EXISTS zip_code text DEFAULT '';
