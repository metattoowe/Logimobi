import { useState, useEffect, useCallback } from 'react';
import { UserCog, Plus, Trash2, Loader2, Shield, Crown, User, Send, Pencil, Copy, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/AuthContext';
import { useToast } from '@/store/ToastContext';
import type { CompanyMember, UserRole } from '@/types';

const roleLabels: Record<UserRole, string> = { admin: 'Administrador', gestor: 'Gestor', atendente: 'Atendente' };
const roleIcons: Record<UserRole, typeof Crown> = { admin: Crown, gestor: Shield, atendente: User };
const roleColors: Record<UserRole, string> = {
  admin: 'bg-brand-yellow-100 text-brand-yellow-800',
  gestor: 'bg-blue-100 text-blue-800',
  atendente: 'bg-ink-100 text-ink-600',
};

interface Invite {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  token: string;
  used: boolean;
}

export function UsersPage() {
  const { user, role, company } = useAuth();
  const { notify } = useToast();
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('atendente');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<CompanyMember | null>(null);
  const [editMember, setEditMember] = useState<CompanyMember | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('atendente');
  const [editSaving, setEditSaving] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    const [memRes, invRes] = await Promise.all([
      supabase.from('company_members')
        .select('id, company_id, user_id, role, email, name, created_at')
        .eq('company_id', company.id)
        .order('created_at', { ascending: true }),
      supabase.from('invites')
        .select('id, email, role, created_at, token, used')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false }),
    ]);

    if (memRes.error) { notify('Erro ao carregar usuários.', 'error'); setLoading(false); return; }
    if (invRes.error) { notify('Erro ao carregar convites.', 'error'); setLoading(false); return; }

    setMembers((memRes.data || []).map((m: { id: string; company_id: string; user_id: string; role: string; email: string; name: string; created_at: string }) => ({
      id: m.id, company_id: m.company_id, user_id: m.user_id, role: m.role as UserRole,
      email: m.email, name: m.name, created_at: m.created_at,
    })));
    setInvites((invRes.data || []).map((i: { id: string; email: string; role: string; created_at: string; token: string; used: boolean }) => ({
      id: i.id, email: i.email, role: i.role as UserRole, created_at: i.created_at, token: i.token, used: i.used,
    })));
    setLoading(false);
  }, [company, notify]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const buildInviteLink = (token: string) => `${window.location.origin}/#/convite/${token}`;

  const handleInvite = async () => {
    if (!company || !inviteEmail.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('invites').insert({
        company_id: company.id,
        email: inviteEmail.trim(),
        role: inviteRole,
      }).select('token').single();
      if (error) throw error;
      const link = buildInviteLink(data.token);
      setInviteLink(link);
      notify('Convite criado com sucesso! Copie o link e envie ao usuário.', 'success');
      setInviteEmail('');
      loadMembers();
    } catch {
      notify('Erro ao criar convite.', 'error');
    } finally {
      setSaving(false);
    }
  };

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

  const handleRemoveMember = async (m: CompanyMember) => {
    try {
      const { error } = await supabase.from('company_members').delete().eq('id', m.id);
      if (error) throw error;
      setMembers(prev => prev.filter(mm => mm.id !== m.id));
      notify('Usuário removido da empresa.', 'success');
    } catch {
      notify('Erro ao remover usuário.', 'error');
    }
    setConfirmDelete(null);
  };

  const handleEditRole = async () => {
    if (!editMember) return;
    setEditSaving(true);
    try {
      const { error } = await supabase.from('company_members').update({ role: editRole }).eq('id', editMember.id);
      if (error) throw error;
      setMembers(prev => prev.map(m => m.id === editMember.id ? { ...m, role: editRole } : m));
      notify('Função atualizada com sucesso.', 'success');
      setEditMember(null);
    } catch {
      notify('Erro ao atualizar função.', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const handleResendInvite = async (inv: Invite) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('invites').update({ created_at: new Date().toISOString() }).eq('id', inv.id);
      if (error) throw error;
      notify('Convite reenviado.', 'success');
      loadMembers();
    } catch {
      notify('Erro ao reenviar convite.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInvite = async (inv: Invite) => {
    try {
      const { error } = await supabase.from('invites').delete().eq('id', inv.id);
      if (error) throw error;
      setInvites(prev => prev.filter(i => i.id !== inv.id));
      notify('Convite cancelado.', 'success');
    } catch {
      notify('Erro ao cancelar convite.', 'error');
    }
  };

  const canManage = role === 'admin' || role === 'gestor';

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-ink-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Usuários</h1>
          <p className="text-sm text-ink-500">{members.length} usuário{members.length !== 1 ? 's' : ''} · {invites.length} convite{invites.length !== 1 ? 's' : ''} pendente{invites.length !== 1 ? 's' : ''}</p>
        </div>
        {canManage && (
          <button onClick={() => setInviteOpen(true)} className="btn-primary"><Plus size={16} /> Convidar usuário</button>
        )}
      </div>

      {/* Active members */}
      <div className="card p-0 overflow-hidden">
        <div className="border-b border-ink-100 px-6 py-3">
          <h3 className="text-sm font-semibold text-ink-700">Membros ativos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="px-6 py-3 font-medium">Nome</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Função</th>
                <th className="px-6 py-3 font-medium">Desde</th>
                {canManage && <th className="px-6 py-3 font-medium text-right">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {members.map(m => {
                const RoleIcon = roleIcons[m.role];
                const isSelf = m.user_id === user?.id;
                return (
                  <tr key={m.id} className="table-row-hover border-b border-ink-50 last:border-0">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-600">
                          {m.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </span>
                        <span className="font-medium text-ink-900">{m.name}{isSelf && <span className="ml-2 text-xs text-ink-400">(você)</span>}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-ink-600">{m.email}</td>
                    <td className="px-6 py-3.5">
                      <span className={`badge ${roleColors[m.role]}`}>
                        <RoleIcon size={12} className="mr-1" /> {roleLabels[m.role]}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-ink-600 whitespace-nowrap">
                      {new Date(m.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    {canManage && (
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {!isSelf && (
                            <>
                              <button onClick={() => { setEditMember(m); setEditRole(m.role); }} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900" title="Editar função">
                                <Pencil size={16} />
                              </button>
                              <button onClick={() => setConfirmDelete(m)} className="rounded-lg p-1.5 text-ink-500 hover:bg-brand-red-50 hover:text-brand-red-600" title="Remover">
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="border-b border-ink-100 px-6 py-3">
            <h3 className="text-sm font-semibold text-ink-700">Convites pendentes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Função</th>
                  <th className="px-6 py-3 font-medium">Enviado em</th>
                  {canManage && <th className="px-6 py-3 font-medium text-right">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {invites.map(inv => (
                  <tr key={inv.id} className="table-row-hover border-b border-ink-50 last:border-0">
                    <td className="px-6 py-3.5 text-ink-600">{inv.email}</td>
                    <td className="px-6 py-3.5">
                      <span className={`badge ${roleColors[inv.role]}`}>{roleLabels[inv.role]}</span>
                    </td>
                    <td className="px-6 py-3.5 text-ink-600 whitespace-nowrap">{new Date(inv.created_at).toLocaleDateString('pt-BR')}</td>
                    {canManage && (
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => copyLink(buildInviteLink(inv.token))} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900" title="Copiar link do convite">
                            <Copy size={16} />
                          </button>
                          <button onClick={() => handleDeleteInvite(inv)} className="rounded-lg p-1.5 text-ink-500 hover:bg-brand-red-50 hover:text-brand-red-600" title="Cancelar convite">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => { setInviteOpen(false); setInviteLink(null); }} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            {inviteLink ? (
              <>
                <h3 className="text-base font-semibold text-ink-900">Convite criado!</h3>
                <p className="mt-1 text-sm text-ink-500">Copie o link abaixo e envie ao novo usuário por email, WhatsApp ou outro canal.</p>
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
                  <button onClick={() => { setInviteOpen(false); setInviteLink(null); }} className="btn-ghost">Fechar</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-ink-900">Convidar usuário</h3>
                <p className="mt-1 text-sm text-ink-500">Crie um convite para um novo membro da equipe.</p>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="label">Email</label>
                    <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="input" placeholder="email@exemplo.com" />
                  </div>
                  <div>
                    <label className="label">Função</label>
                    <select value={inviteRole} onChange={e => setInviteRole(e.target.value as UserRole)} className="input">
                      <option value="admin">Administrador</option>
                      <option value="gestor">Gestor</option>
                      <option value="atendente">Atendente</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setInviteOpen(false)} className="btn-ghost">Cancelar</button>
                  <button onClick={handleInvite} disabled={saving || !inviteEmail.trim()} className="btn-primary">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : 'Criar convite'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit role modal */}
      {editMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setEditMember(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-ink-900">Editar função</h3>
            <p className="mt-1 text-sm text-ink-500">{editMember.name} · {editMember.email}</p>
            <div className="mt-4">
              <label className="label">Função</label>
              <select value={editRole} onChange={e => setEditRole(e.target.value as UserRole)} className="input">
                <option value="admin">Administrador</option>
                <option value="gestor">Gestor</option>
                <option value="atendente">Atendente</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditMember(null)} className="btn-ghost">Cancelar</button>
              <button onClick={handleEditRole} disabled={editSaving} className="btn-primary">
                {editSaving ? <Loader2 size={16} className="animate-spin" /> : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-ink-900">Remover usuário?</h3>
            <p className="mt-2 text-sm text-ink-600"><span className="font-medium">{confirmDelete.name}</span> perderá acesso à empresa.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost">Cancelar</button>
              <button onClick={() => handleRemoveMember(confirmDelete)} className="btn-danger">Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
