import { useState } from 'react';
import { Building, Mail, Lock, ArrowRight, Loader2, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/store/AuthContext';
import { supabase } from '@/lib/supabase';

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await signIn(email, password);
      if (err) setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail.trim());
      if (err) throw err;
      setResetSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar email de recuperação.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-900 text-white shadow-lg">
            <Building size={28} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-ink-900">LogImobi</h1>
          <p className="mt-1 text-sm text-ink-500">Plataforma de Gestão de Ocorrências Imobiliárias</p>
        </div>

        <div className="card p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-ink-900">Entrar</h2>
          <p className="mt-1 text-sm text-ink-500">Acesse o painel da sua imobiliária</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input pl-9"
                  placeholder="seu@email.com"
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pl-9"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-brand-red-200 bg-brand-red-50 p-3">
                <p className="text-xs text-brand-red-700">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Aguarde...</> : <>Entrar <ArrowRight size={16} /></>}
            </button>
          </form>

          <button onClick={() => { setResetOpen(true); setResetSent(false); setError(null); }} className="mt-4 flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-900">
            <KeyRound size={12} /> Esqueceu sua senha? Recuperar acesso
          </button>

          <div className="mt-6 rounded-lg border border-ink-100 bg-ink-50/50 px-4 py-3">
            <p className="text-xs text-ink-500">
              Não tem uma conta? Solicite acesso ao administrador da sua imobiliária. Novos usuários são cadastrados apenas por convite.
            </p>
          </div>
        </div>

        {resetOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setResetOpen(false)} />
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              {resetSent ? (
                <>
                  <h3 className="text-base font-semibold text-ink-900">Email enviado</h3>
                  <p className="mt-2 text-sm text-ink-600">Enviamos um link de recuperação para <span className="font-medium">{resetEmail}</span>. Verifique sua caixa de entrada.</p>
                  <button onClick={() => setResetOpen(false)} className="btn-primary mt-5 w-full">Entendido</button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-ink-900">Recuperar senha</h3>
                    <button onClick={() => setResetOpen(false)} className="text-ink-400 hover:text-ink-600"><ArrowLeft size={18} /></button>
                  </div>
                  <p className="mt-2 text-sm text-ink-500">Informe seu email para receber um link de recuperação.</p>
                  <form onSubmit={handleReset} className="mt-4 space-y-4">
                    <div>
                      <label className="label">Email</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                        <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="input pl-9" placeholder="seu@email.com" />
                      </div>
                    </div>
                    {error && <p className="text-xs text-brand-red-600">{error}</p>}
                    <button type="submit" disabled={resetLoading || !resetEmail.trim()} className="btn-primary w-full">
                      {resetLoading ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : <>Enviar link <ArrowRight size={16} /></>}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-ink-400">© 2026 LogImobi — Plataforma SaaS para Imobiliárias</p>
      </div>
    </div>
  );
}
