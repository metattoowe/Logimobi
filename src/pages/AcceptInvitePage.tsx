import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types';

interface InviteInfo {
  email: string;
  role: UserRole;
  company_name: string;
}

export function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setError('Token inválido.'); setLoading(false); return; }
    (async () => {
      const { data, error: err } = await supabase
        .from('invites')
        .select('email, role, used, companies(name)')
        .eq('token', token)
        .maybeSingle();
      if (err || !data) { setError('Convite não encontrado ou expirado.'); setLoading(false); return; }
      if (data.used) { setError('Este convite já foi utilizado.'); setLoading(false); return; }
      setInvite({
        email: data.email,
        role: data.role as UserRole,
        company_name: (data.companies as { name: string }).name,
      });
      setLoading(false);
    })();
  }, [token]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite || !token) return;
    if (form.password !== form.confirm) { setError('As senhas não conferem.'); return; }
    if (form.password.length < 6) { setError('A senha deve ter no mínimo 6 caracteres.'); return; }
    if (!form.name.trim()) { setError('Informe seu nome.'); return; }
    setSaving(true);
    setError(null);
    try {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: invite.email,
        password: form.password,
        options: { data: { name: form.name.trim() } },
      });
      if (signInErr) throw signInErr;

      if (signUpData.user) {
        await supabase.from('invites').update({ used: true }).eq('token', token);
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aceitar convite.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <Loader2 size={24} className="animate-spin text-ink-400" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-ink-900">Conta criada com sucesso!</h1>
          <p className="mt-2 text-sm text-ink-600">Sua conta está pronta. Você já pode fazer login com seu email e senha.</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-6 w-full">
            Ir para o login <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-red-100">
            <span className="text-2xl">!</span>
          </div>
          <h1 className="mt-4 text-xl font-bold text-ink-900">Convite inválido</h1>
          <p className="mt-2 text-sm text-ink-600">{error}</p>
          <button onClick={() => navigate('/')} className="btn-outline mt-6">Voltar ao login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-900 text-white">
            <Building size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-ink-900">LogImobi</p>
            <p className="text-xs text-ink-400">Aceitar convite</p>
          </div>
        </div>

        {invite && (
          <div className="mt-6 rounded-lg border border-ink-100 bg-ink-50/50 p-4">
            <p className="text-xs text-ink-500">Você foi convidado para ingressar em</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">{invite.company_name}</p>
            <p className="mt-0.5 text-xs text-ink-500">como {invite.role === 'gestor' ? 'Gestor' : 'Atendente'}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-600">
              <Mail size={12} /> {invite.email}
            </p>
          </div>
        )}

        <form onSubmit={handleAccept} className="mt-6 space-y-4">
          <div>
            <label className="label">Nome completo</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="label">Senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input pl-9 pr-9"
                placeholder="Mínimo 6 caracteres"
              />
              <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Confirmar senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type={showPw ? 'text' : 'password'}
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                className="input pl-9"
                placeholder="Repita a senha"
              />
            </div>
          </div>
          {error && <p className="text-xs text-brand-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Criando conta...</> : <>Criar conta e acessar <ArrowRight size={16} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
