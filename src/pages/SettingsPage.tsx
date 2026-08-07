import { useState, useEffect } from 'react';
import { Building, Bell, Shield, Palette, User, Save, Loader2, Upload, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/AuthContext';
import { useToast } from '@/store/ToastContext';
import type { UserRole } from '@/types';
import { useNavigate } from 'react-router-dom';

const roleLabels: Record<UserRole, string> = { admin: 'Administrador', gestor: 'Gestor', atendente: 'Atendente' };

export function SettingsPage() {
  const { company, role, user, reloadCompany } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ old: '', nw: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleChangePassword = async () => {
    setPwError(null);
    if (pwForm.nw !== pwForm.confirm) { setPwError('As senhas não conferem.'); return; }
    if (pwForm.nw.length < 6) { setPwError('A nova senha deve ter no mínimo 6 caracteres.'); return; }
    setPwSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.nw });
      if (error) throw error;
      notify('Senha alterada com sucesso.', 'success');
      setPwForm({ old: '', nw: '', confirm: '' });
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Erro ao alterar senha.');
    } finally {
      setPwSaving(false);
    }
  };

  useEffect(() => {
    if (company) {
      setForm({ name: company.name, phone: company.phone, email: company.email });
    }
  }, [company]);

  const handleSave = async () => {
    if (!company || !form.name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ name: form.name.trim(), phone: form.phone, email: form.email })
        .eq('id', company.id);
      if (error) throw error;
      await reloadCompany();
      notify('Dados da empresa atualizados com sucesso.', 'success');
    } catch {
      notify('Erro ao atualizar dados da empresa.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-900">Configurações</h1>
        <p className="text-sm text-ink-500">Preferências da empresa e do sistema</p>
      </div>

      <div className="card p-6">
        <div className="mb-5 flex items-center gap-2">
          <Building size={18} className="text-ink-500" />
          <h3 className="text-base font-semibold text-ink-900">Dados da Empresa</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Nome da Imobiliária</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="Nome da empresa" />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" placeholder="(00) 00000-0000" />
          </div>
          <div>
            <label className="label">Email de contato</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" placeholder="contato@imobiliaria.com" />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button onClick={handleSave} disabled={saving || !form.name.trim()} className="btn-primary">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : <><Save size={16} /> Salvar alterações</>}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-5 flex items-center gap-2">
          <User size={18} className="text-ink-500" />
          <h3 className="text-base font-semibold text-ink-900">Seu Perfil</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nome</label>
            <input value={user?.name || ''} disabled className="input opacity-60" />
          </div>
          <div>
            <label className="label">Email</label>
            <input value={user?.email || ''} disabled className="input opacity-60" />
          </div>
          <div>
            <label className="label">Função</label>
            <div className="flex items-center gap-2">
              <span className="badge bg-ink-100 text-ink-700">{role ? roleLabels[role] : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-5 flex items-center gap-2">
          <Lock size={18} className="text-ink-500" />
          <h3 className="text-base font-semibold text-ink-900">Alterar Senha</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Senha atual</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type={showOld ? 'text' : 'password'}
                value={pwForm.old}
                onChange={e => setPwForm(f => ({ ...f, old: e.target.value }))}
                className="input pl-9 pr-9"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowOld(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="hidden sm:block" />
          <div>
            <label className="label">Nova senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type={showNew ? 'text' : 'password'}
                value={pwForm.nw}
                onChange={e => setPwForm(f => ({ ...f, nw: e.target.value }))}
                className="input pl-9 pr-9"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowNew(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Confirmar nova senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type={showNew ? 'text' : 'password'}
                value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                className="input pl-9"
                placeholder="Repita a nova senha"
                autoComplete="new-password"
              />
            </div>
          </div>
        </div>
        {pwError && <p className="mt-3 text-xs text-brand-red-600">{pwError}</p>}
        <div className="mt-5 flex justify-end">
          <button onClick={handleChangePassword} disabled={pwSaving || !pwForm.old || !pwForm.nw} className="btn-primary">
            {pwSaving ? <><Loader2 size={16} className="animate-spin" /> Alterando...</> : <><Lock size={16} /> Alterar senha</>}
          </button>
        </div>
      </div>

      <div className="card divide-y divide-ink-100">
        <SettingRow icon={Bell} title="Notificações" desc="Alertas de novas ocorrências e prazos" comingSoon />
        <SettingRow icon={Shield} title="Permissões de usuários" desc="Gerenciar acessos da equipe interna" comingSoon />
        <SettingRow icon={Palette} title="Aparência" desc="Tema, cores e densidade da interface" comingSoon />
        <SettingRow icon={Upload} title="Importação de dados" desc="Importar proprietários, imóveis, inquilinos e ocorrências via CSV" onClick={() => navigate('/importar')} />
      </div>
    </div>
  );
}

function SettingRow({ icon: Icon, title, desc, comingSoon, onClick }: { icon: typeof User; title: string; desc: string; comingSoon?: boolean; onClick?: () => void }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-100 text-ink-600">
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-ink-900">{title}</p>
        <p className="text-sm text-ink-500">{desc}</p>
      </div>
      {comingSoon ? (
        <span className="badge border border-ink-200 bg-ink-50 text-ink-400">Em breve</span>
      ) : (
        <button onClick={onClick} className="btn-outline text-sm">Gerenciar</button>
      )}
    </div>
  );
}
