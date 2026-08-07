import { useState, useEffect, useCallback } from 'react';
import { Shield, Building, Plus, Loader2, Ban, CheckCircle2, Send, Users, X, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/AuthContext';
import { useToast } from '@/store/ToastContext';
import type { Company } from '@/types';

export function AdminPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [newForm, setNewForm] = useState({ name: '', email: '', phone: '', max_users: 5 });
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const buildInviteLink = (token: string) => `${window.location.origin}/#/convite/${token}`;

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      notify('Link copiado!', 'success');
    } catch {
      notify('Não foi possível copiar. Selecione manualmente.', 'error');
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
    if (error) { notify('Erro ao carregar empresas.', 'error'); setLoading(false); return; }
    setCompanies((data || []) as Company[]);
    setLoading(false);
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newForm.name.trim()) return;
    setSaving(true);
    try {
      const slug = lower(newForm.name) + '-' + Math.random().toString(36).slice(2, 8);
      const { error } = await supabase.from('companies').insert({
        name: newForm.name.trim(),
        email: newForm.email,
        phone: newForm.phone,
        max_users: newForm.max_users,
        slug,
      });
      if (error) throw error;
      notify('Imobiliária criada com sucesso.', 'success');
      setNewForm({ name: '', email: '', phone: '', max_users: 5 });
      setCreateOpen(false);
      load();
    } catch {
      notify('Erro ao criar imobiliária.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleBlocked = async (c: Company) => {
    try {
      const { error } = await supabase.from('companies').update({ blocked: !c.blocked }).eq('id', c.id);
      if (error) throw error;
      setCompanies(prev => prev.map(cc => cc.id === c.id ? { ...cc, blocked: !cc.blocked } : cc));
      notify(c.blocked ? 'Imobiliária desbloqueada.' : 'Imobiliária bloqueada.', 'success');
    } catch {
      notify('Erro ao alterar status.', 'error');
    }
  };

  const updateMaxUsers = async (c: Company, max: number) => {
    try {
      const { error } = await supabase.from('companies').update({ max_users: max }).eq('id', c.id);
      if (error) throw error;
      setCompanies(prev => prev.map(cc => cc.id === c.id ? { ...cc, max_users: max } : cc));
      notify('Limite atualizado.', 'success');
    } catch {
      notify('Erro ao atualizar limite.', 'error');
    }
  };

  const inviteGestor = async (c: Company) => {
    if (!inviteForm.email.trim()) return;
    setSaving(true);
    try {
      const { data: membership } = await supabase
        .from('company_members')
        .select('user_id')
        .eq('company_id', c.id)
        .eq('role', 'gestor')
        .maybeSingle();
      if (membership) {
        notify('Esta imobiliária já possui um gestor.', 'error');
        setSaving(false);
        return;
      }

      const { data, error } = await supabase.from('invites').insert({
        company_id: c.id,
        email: inviteForm.email.trim(),
        role: 'gestor',
        invited_by: user?.id,
      }).select('token').single();
      if (error) throw error;
      setInviteLink(buildInviteLink(data.token));
      notify(`Convite criado para ${inviteForm.email}.`, 'success');
      setInviteForm({ email: '', role: 'gestor' });
    } catch {
      notify('Erro ao criar convite.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-ink-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Painel do Administrador</h1>
          <p className="text-sm text-ink-500">Gerenciar imobiliárias da plataforma</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary"><Plus size={16} /> Nova Imobiliária</button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-900 text-white"><Building size={20} /></div>
          <p className="mt-4 text-3xl font-bold text-ink-900">{companies.length}</p>
          <p className="text-sm text-ink-500">Imobiliárias cadastradas</p>
        </div>
        <div className="card p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-red-500 text-white"><Ban size={20} /></div>
          <p className="mt-4 text-3xl font-bold text-ink-900">{companies.filter(c => c.blocked).length}</p>
          <p className="text-sm text-ink-500">Imobiliárias bloqueadas</p>
        </div>
        <div className="card p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white"><CheckCircle2 size={20} /></div>
          <p className="mt-4 text-3xl font-bold text-ink-900">{companies.filter(c => !c.blocked).length}</p>
          <p className="text-sm text-ink-500">Imobiliárias ativas</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="border-b border-ink-100 px-6 py-3">
          <h3 className="text-sm font-semibold text-ink-700">Imobiliárias</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="px-6 py-3 font-medium">Nome</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Plano</th>
                <th className="px-6 py-3 font-medium">Limite</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(c => (
                <tr key={c.id} className="table-row-hover border-b border-ink-50 last:border-0">
                  <td className="px-6 py-3.5 font-medium text-ink-900">{c.name}</td>
                  <td className="px-6 py-3.5 text-ink-600">{c.email}</td>
                  <td className="px-6 py-3.5 text-ink-600">{c.plan}</td>
                  <td className="px-6 py-3.5">
                    <input
                      type="number"
                      min={1}
                      value={c.max_users}
                      onChange={e => updateMaxUsers(c, Number(e.target.value) || 1)}
                      className="w-16 rounded border border-ink-200 px-2 py-1 text-sm text-ink-700 focus:border-ink-400 focus:outline-none"
                    />
                  </td>
                  <td className="px-6 py-3.5">
                    {c.blocked ? (
                      <span className="badge bg-brand-red-50 text-brand-red-700 border border-brand-red-200">Bloqueada</span>
                    ) : (
                      <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">Ativa</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditCompany(c)} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900" title="Convidar Gestor">
                        <Send size={16} />
                      </button>
                      <button onClick={() => toggleBlocked(c)} className={`rounded-lg p-1.5 hover:bg-ink-100 ${c.blocked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-brand-red-600 hover:bg-brand-red-50'}`} title={c.blocked ? 'Desbloquear' : 'Bloquear'}>
                        {c.blocked ? <CheckCircle2 size={16} /> : <Ban size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create company modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink-900">Nova Imobiliária</h3>
              <button onClick={() => setCreateOpen(false)} className="rounded-lg p-1 text-ink-400 hover:bg-ink-100"><X size={18} /></button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="label">Nome da imobiliária</label>
                <input value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="Imobiliária Exemplo" />
              </div>
              <div>
                <label className="label">Email de contato</label>
                <input type="email" value={newForm.email} onChange={e => setNewForm(f => ({ ...f, email: e.target.value }))} className="input" placeholder="contato@imobiliaria.com" />
              </div>
              <div>
                <label className="label">Telefone</label>
                <input value={newForm.phone} onChange={e => setNewForm(f => ({ ...f, phone: e.target.value }))} className="input" placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label className="label">Limite máximo de usuários</label>
                <input type="number" min={1} value={newForm.max_users} onChange={e => setNewForm(f => ({ ...f, max_users: Number(e.target.value) || 1 }))} className="input" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setCreateOpen(false)} className="btn-ghost">Cancelar</button>
              <button onClick={handleCreate} disabled={saving || !newForm.name.trim()} className="btn-primary">
                {saving ? <Loader2 size={16} className="animate-spin" /> : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite gestor modal */}
      {editCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => { setEditCompany(null); setInviteLink(null); }} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            {inviteLink ? (
              <>
                <h3 className="text-base font-semibold text-ink-900">Convite criado!</h3>
                <p className="mt-1 text-sm text-ink-500">Copie o link abaixo e envie ao gestor por email ou WhatsApp.</p>
                <div className="mt-4">
                  <label className="label">Link do convite</label>
                  <div className="flex gap-2">
                    <input readOnly value={inviteLink} className="input flex-1 text-xs" onFocus={e => e.target.select()} />
                    <button onClick={() => copyLink(inviteLink)} className="btn-primary shrink-0">
                      {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />} Copiar
                    </button>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button onClick={() => { setEditCompany(null); setInviteLink(null); }} className="btn-ghost">Fechar</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-ink-900">Convidar Gestor</h3>
                    <p className="text-sm text-ink-500">{editCompany.name}</p>
                  </div>
                  <button onClick={() => setEditCompany(null)} className="rounded-lg p-1 text-ink-400 hover:bg-ink-100"><X size={18} /></button>
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="label">Email do gestor</label>
                    <input type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} className="input" placeholder="gestor@imobiliaria.com" />
                  </div>
                  <p className="text-xs text-ink-500">O gestor receberá um link de convite para criar sua conta e senha.</p>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setEditCompany(null)} className="btn-ghost">Cancelar</button>
                  <button onClick={() => inviteGestor(editCompany)} disabled={saving || !inviteForm.email.trim()} className="btn-primary">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Criar convite</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function lower(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
