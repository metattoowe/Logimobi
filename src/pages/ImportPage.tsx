import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, FileUp } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/store/ToastContext';
import type { Category, Priority, OccurrenceStatus, PropertyStatus } from '@/types';

type EntityType = 'owners' | 'properties' | 'tenants' | 'occurrences';

const entityLabels: Record<EntityType, string> = {
  owners: 'Proprietários',
  properties: 'Imóveis',
  tenants: 'Inquilinos',
  occurrences: 'Ocorrências',
};

const templates: Record<EntityType, string> = {
  owners: 'name,cpf,phone,email,notes\nJoão Silva,123.456.789-00,(11) 99999-9999,joao@email.com,Cliente novo',
  properties: 'code,address,number,district,city,state,zip_code,status,owner_id,type,bedrooms,bathrooms,area\nIMB-0001,Rua das Flores,123,Centro,São Paulo,SP,01000-000,Disponível,,Apartamento,2,1,80',
  tenants: 'name,cpf,phone,email,entry_date,expected_exit_date,notes\nMaria Santos,987.654.321-00,(11) 88888-8888,maria@email.com,2026-01-01,2026-12-31,Inquilina nova',
  occurrences: 'property_id,title,description,category,responsible,status,priority,date\nIMB-0001,Vazamento na cozinha,Vazamento na pia da cozinha,Vazamento,João Silva,Aberto,Alta,2026-08-05',
};

const requiredFields: Record<EntityType, string[]> = {
  owners: ['name'],
  properties: ['code', 'address', 'city'],
  tenants: ['name'],
  occurrences: ['property_id', 'title', 'category'],
};

const validCategories: Category[] = ['Vazamento', 'Infiltração', 'Elétrica', 'Pintura', 'Limpeza', 'Vistoria', 'Reclamação', 'Jurídico', 'Outros'];
const validPriorities: Priority[] = ['Baixa', 'Média', 'Alta', 'Urgente'];
const validOccStatuses: OccurrenceStatus[] = ['Aberto', 'Em andamento', 'Aguardando proprietário', 'Resolvido'];
const validPropStatuses: PropertyStatus[] = ['Disponível', 'Alugado', 'Em venda', 'Vendido', 'Em reforma'];

interface ImportResult {
  total: number;
  imported: number;
  errors: string[];
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = lines.slice(1).map(line => line.split(',').map(c => c.trim()));
  return { headers, rows };
}

function downloadTemplate(entity: EntityType) {
  const blob = new Blob([templates[entity]], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `modelo_${entity}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportPage() {
  const { addOwner, addProperty, addTenant, addOccurrence, properties } = useStore();
  const { notify } = useToast();
  const [entityType, setEntityType] = useState<EntityType>('owners');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setResult(null); }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);
      const required = requiredFields[entityType];
      const missing = required.filter(r => !headers.includes(r));
      if (missing.length > 0) {
        setResult({ total: 0, imported: 0, errors: [`Campos obrigatórios ausentes no cabeçalho: ${missing.join(', ')}`] });
        notify('Importação falhou: cabeçalho inválido.', 'error');
        setImporting(false);
        return;
      }

      let imported = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const obj: Record<string, string> = {};
        headers.forEach((h, idx) => { obj[h] = row[idx] || ''; });

        try {
          if (entityType === 'owners') {
            if (!obj.name) { errors.push(`Linha ${i + 2}: Nome é obrigatório.`); continue; }
            await addOwner({
              name: obj.name, cpf: obj.cpf || '', phone: obj.phone || '',
              email: obj.email || '', notes: obj.notes || '',
            });
            imported++;
          } else if (entityType === 'properties') {
            if (!obj.code || !obj.address || !obj.city) { errors.push(`Linha ${i + 2}: Código, endereço e cidade são obrigatórios.`); continue; }
            const status = validPropStatuses.includes(obj.status as PropertyStatus) ? obj.status as PropertyStatus : 'Disponível';
            await addProperty({
              code: obj.code, address: obj.address, number: obj.number || '',
              district: obj.district || '', city: obj.city, state: obj.state || '',
              zip_code: obj.zip_code || '', status, owner_id: obj.owner_id || '',
              type: obj.type || 'Apartamento',
              bedrooms: Number(obj.bedrooms) || 0, bathrooms: Number(obj.bathrooms) || 0,
              area: Number(obj.area) || 0, tenant_id: null,
            });
            imported++;
          } else if (entityType === 'tenants') {
            if (!obj.name) { errors.push(`Linha ${i + 2}: Nome é obrigatório.`); continue; }
            await addTenant({
              name: obj.name, cpf: obj.cpf || '', phone: obj.phone || '',
              email: obj.email || '', entry_date: obj.entry_date || null,
              expected_exit_date: obj.expected_exit_date || null, notes: obj.notes || '',
            });
            imported++;
          } else if (entityType === 'occurrences') {
            if (!obj.property_id || !obj.title || !obj.category) { errors.push(`Linha ${i + 2}: property_id, title e category são obrigatórios.`); continue; }
            const prop = properties.find(p => p.code === obj.property_id || p.id === obj.property_id);
            if (!prop) { errors.push(`Linha ${i + 2}: Imóvel "${obj.property_id}" não encontrado.`); continue; }
            const category = validCategories.includes(obj.category as Category) ? obj.category as Category : 'Outros';
            const priority = validPriorities.includes(obj.priority as Priority) ? obj.priority as Priority : 'Média';
            const status = validOccStatuses.includes(obj.status as OccurrenceStatus) ? obj.status as OccurrenceStatus : 'Aberto';
            await addOccurrence({
              property_id: prop.id, title: obj.title, description: obj.description || '',
              category, responsible: obj.responsible || 'Não atribuído', status, priority,
              date: obj.date || new Date().toISOString().split('T')[0],
            });
            imported++;
          }
        } catch (err) {
          errors.push(`Linha ${i + 2}: ${err instanceof Error ? err.message : 'Erro ao salvar.'}`);
        }
      }

      setResult({ total: rows.length, imported, errors });
      if (imported > 0) notify(`${imported} registro${imported !== 1 ? 's' : ''} importado${imported !== 1 ? 's' : ''} com sucesso.`, 'success');
      if (errors.length > 0 && imported === 0) notify('Importação falhou: nenhum registro válido.', 'error');
    } catch {
      notify('Erro ao ler o arquivo.', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-900">Importar Dados</h1>
        <p className="text-sm text-ink-500">Importe registros em lote via arquivo CSV</p>
      </div>

      {/* Template download */}
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileSpreadsheet size={18} className="text-ink-500" />
          <h3 className="text-base font-semibold text-ink-900">Baixar Modelo</h3>
        </div>
        <p className="mb-4 text-sm text-ink-500">Baixe o modelo CSV preenchido com os cabeçalhos corretos para cada tipo de importação.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(entityLabels) as EntityType[]).map(e => (
            <button
              key={e}
              onClick={() => downloadTemplate(e)}
              className="flex items-center gap-2 rounded-lg border border-ink-200 px-4 py-3 text-sm font-medium text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-50"
            >
              <Download size={15} className="text-brand-yellow-700" />
              {entityLabels[e]}
            </button>
          ))}
        </div>
      </div>

      {/* Import */}
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileUp size={18} className="text-ink-500" />
          <h3 className="text-base font-semibold text-ink-900">Importar Arquivo</h3>
        </div>

        <div className="mb-4">
          <label className="label">Tipo de registro</label>
          <select value={entityType} onChange={e => { setEntityType(e.target.value as EntityType); setResult(null); setFile(null); }} className="input max-w-xs">
            {(Object.keys(entityLabels) as EntityType[]).map(e => (
              <option key={e} value={e}>{entityLabels[e]}</option>
            ))}
          </select>
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/50 px-6 py-10 transition-colors hover:border-ink-300 hover:bg-ink-50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100">
            <Upload size={24} className="text-ink-400" />
          </div>
          {file ? (
            <div className="mt-3 text-center">
              <p className="text-sm font-medium text-ink-900">{file.name}</p>
              <p className="mt-1 text-xs text-ink-400">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
          ) : (
            <>
              <p className="mt-3 text-sm font-medium text-ink-700">Clique para selecionar um arquivo CSV</p>
              <p className="mt-1 text-xs text-ink-400">Use o modelo correspondente para garantir os cabeçalhos corretos</p>
            </>
          )}
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" />
        </div>

        <div className="mt-5 flex justify-end">
          <button onClick={handleImport} disabled={importing || !file} className="btn-primary">
            {importing ? <><Loader2 size={16} className="animate-spin" /> Importando...</> : <><Upload size={16} /> Importar dados</>}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            {result.imported > 0 ? <CheckCircle2 size={18} className="text-brand-green-600" /> : <AlertCircle size={18} className="text-brand-red-500" />}
            <h3 className="text-base font-semibold text-ink-900">Resultado da Importação</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-ink-100 bg-ink-50/50 p-4">
              <p className="text-xs text-ink-400">Total de linhas</p>
              <p className="mt-1 text-2xl font-bold text-ink-900">{result.total}</p>
            </div>
            <div className="rounded-lg border border-brand-green-200 bg-brand-green-50 p-4">
              <p className="text-xs text-brand-green-700">Importados</p>
              <p className="mt-1 text-2xl font-bold text-brand-green-700">{result.imported}</p>
            </div>
            <div className="rounded-lg border border-brand-red-200 bg-brand-red-50 p-4">
              <p className="text-xs text-brand-red-700">Erros</p>
              <p className="mt-1 text-2xl font-bold text-brand-red-700">{result.errors.length}</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-4 max-h-48 overflow-y-auto rounded-lg border border-brand-red-200 bg-brand-red-50 p-4">
              <p className="mb-2 text-xs font-semibold text-brand-red-700">Erros encontrados:</p>
              <ul className="space-y-1">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-xs text-brand-red-600">{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
