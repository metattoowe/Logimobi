import { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/store/ToastContext';
import type { Property, PropertyStatus } from '@/types';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  property?: Property | null;
}

const propertyTypes = ['Apartamento', 'Casa', 'Sobrado', 'Quitinete', 'Cobertura', 'Studio', 'Loft', 'Comercial', 'Terreno'];
const statuses: PropertyStatus[] = ['Disponível', 'Alugado', 'Em venda', 'Vendido', 'Em reforma'];
const states = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const empty = {
  code: '', address: '', number: '', district: '', city: '', state: '', zip_code: '',
  status: 'Disponível' as PropertyStatus, owner_id: '', tenant_id: '', type: 'Apartamento',
  bedrooms: 0, bathrooms: 0, area: 0,
};

export function PropertyFormModal({ open, onClose, property }: Props) {
  const { owners, tenants, addProperty, updateProperty } = useStore();
  const { notify } = useToast();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (property) {
      setForm({
        code: property.code, address: property.address, number: property.number,
        district: property.district, city: property.city, state: property.state,
        zip_code: property.zip_code, status: property.status, owner_id: property.owner_id,
        tenant_id: property.tenant_id || '', type: property.type,
        bedrooms: property.bedrooms, bathrooms: property.bathrooms, area: property.area,
      });
    } else {
      setForm({ ...empty, owner_id: owners[0]?.id || '' });
    }
    setTouched(false);
  }, [property, open, owners]);

  const set = (k: keyof typeof form, v: string | number) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!property;
  const canSave = form.code.trim().length > 0 && form.address.trim().length > 0 && form.city.trim().length > 0;

  const handleSave = async () => {
    setTouched(true);
    if (!canSave) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        code: form.code.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        area: Number(form.area) || 0,
        tenant_id: form.tenant_id || null,
      };
      if (isEdit && property) {
        await updateProperty(property.id, payload);
        notify('Imóvel atualizado com sucesso.', 'success');
      } else {
        await addProperty(payload);
        notify('Imóvel cadastrado com sucesso.', 'success');
      }
      onClose();
    } catch {
      notify('Erro ao salvar imóvel.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar Imóvel' : 'Novo Imóvel'}
      subtitle={isEdit ? property!.code : 'Cadastre um novo imóvel'}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-ghost" disabled={saving}>Cancelar</button>
          <button onClick={handleSave} className="btn-primary" disabled={saving || !canSave}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : isEdit ? 'Salvar alterações' : 'Cadastrar'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Código <span className="text-brand-red-500">*</span></label>
          <input value={form.code} onChange={e => set('code', e.target.value)} className="input" placeholder="IMB-0001" />
          {touched && !form.code.trim() && <p className="mt-1 text-xs text-brand-red-500">O código é obrigatório.</p>}
        </div>
        <div>
          <label className="label">Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className="input">
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Endereço <span className="text-brand-red-500">*</span></label>
          <input value={form.address} onChange={e => set('address', e.target.value)} className="input" placeholder="Rua, Avenida..." />
          {touched && !form.address.trim() && <p className="mt-1 text-xs text-brand-red-500">O endereço é obrigatório.</p>}
        </div>
        <div>
          <label className="label">Número</label>
          <input value={form.number} onChange={e => set('number', e.target.value)} className="input" placeholder="123" />
        </div>
        <div>
          <label className="label">Bairro</label>
          <input value={form.district} onChange={e => set('district', e.target.value)} className="input" placeholder="Centro" />
        </div>
        <div>
          <label className="label">Cidade <span className="text-brand-red-500">*</span></label>
          <input value={form.city} onChange={e => set('city', e.target.value)} className="input" placeholder="São Paulo" />
          {touched && !form.city.trim() && <p className="mt-1 text-xs text-brand-red-500">A cidade é obrigatória.</p>}
        </div>
        <div>
          <label className="label">Estado</label>
          <select value={form.state} onChange={e => set('state', e.target.value)} className="input">
            <option value="">Selecione</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">CEP</label>
          <input value={form.zip_code} onChange={e => set('zip_code', e.target.value)} className="input" placeholder="00000-000" />
        </div>
        <div>
          <label className="label">Proprietário</label>
          <select value={form.owner_id} onChange={e => set('owner_id', e.target.value)} className="input">
            <option value="">Sem proprietário</option>
            {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          {owners.length === 0 && <p className="mt-1 text-xs text-ink-400">Cadastre um proprietário primeiro.</p>}
        </div>
        <div>
          <label className="label">Inquilino</label>
          <select value={form.tenant_id} onChange={e => set('tenant_id', e.target.value)} className="input">
            <option value="">Sem inquilino</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Tipo</label>
          <select value={form.type} onChange={e => set('type', e.target.value)} className="input">
            {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Quartos</label>
          <input type="number" min={0} value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Banheiros</label>
          <input type="number" min={0} value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Área (m²)</label>
          <input type="number" min={0} value={form.area} onChange={e => set('area', e.target.value)} className="input" />
        </div>
      </div>
    </Modal>
  );
}
