import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Phone, Mail, CreditCard, StickyNote, Building2, Eye, Pencil, Loader2 } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { propertyStatusStyles } from '@/lib/status';
import { OwnerFormModal } from '@/components/OwnerFormModal';
import type { Owner } from '@/types';

export function OwnerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getOwner, propertiesByOwner, loading } = useStore();
  const [formOpen, setFormOpen] = useState(false);
  const owner = id ? getOwner(id) : undefined;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-ink-400" /></div>;
  }

  if (!owner) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-ink-500">Proprietário não encontrado.</p>
        <button onClick={() => navigate('/proprietarios')} className="btn-outline mt-4">Voltar</button>
      </div>
    );
  }

  const props = propertiesByOwner(owner.id);

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/proprietarios')} className="btn-ghost -ml-2"><ArrowLeft size={16} /> Voltar</button>

      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-900 text-lg font-bold text-white">{owner.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</span>
            <div>
              <h1 className="text-xl font-bold text-ink-900">{owner.name}</h1>
              <p className="text-sm text-ink-500">{props.length} imóvel{props.length !== 1 ? 'veis' : ''} vinculado{props.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={() => setFormOpen(true)} className="btn-outline"><Pencil size={16} /> Editar</button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem icon={Phone} label="Telefone" value={owner.phone} />
          <InfoItem icon={Mail} label="Email" value={owner.email} />
          <InfoItem icon={CreditCard} label="CPF" value={owner.cpf} />
          <InfoItem icon={StickyNote} label="Observações" value={owner.notes} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold text-ink-900">Imóveis do proprietário</h2>
        {props.length === 0 ? (
          <div className="card px-6 py-12 text-center">
            <Building2 className="mx-auto text-ink-300" size={32} />
            <p className="mt-2 text-sm text-ink-400">Nenhum imóvel vinculado a este proprietário.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {props.map(p => {
              const st = propertyStatusStyles[p.status];
              return (
                <div key={p.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold text-brand-yellow-700">{p.code}</span>
                    <span className={`badge ${st.badge}`}>{st.label}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-ink-900">{p.address}{p.number ? `, ${p.number}` : ''}</p>
                  <p className="text-sm text-ink-500">{p.district}, {p.city}{p.state ? ` - ${p.state}` : ''}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-ink-400">
                    <span>{p.type}</span>
                    <span>·</span>
                    <span>{p.bedrooms} quartos</span>
                    <span>·</span>
                    <span>{p.area}m²</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => navigate(`/imoveis/${p.id}`)} className="btn-outline flex-1 text-xs"><Eye size={14} /> Detalhes</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <OwnerFormModal open={formOpen} onClose={() => setFormOpen(false)} owner={owner as Owner} />
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-100 bg-ink-50/50 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-ink-400"><Icon size={13} /> {label}</p>
      <p className="mt-1 text-sm font-medium text-ink-800 break-words">{value || '—'}</p>
    </div>
  );
}
