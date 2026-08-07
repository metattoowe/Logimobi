import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Company, UserRole } from '@/types';

interface AuthContextValue {
  user: { email: string; name: string; id: string } | null;
  session: Session | null;
  loading: boolean;
  company: Company | null;
  role: UserRole | null;
  isPlatformAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  reloadCompany: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function displayName(user: User | null): string {
  if (!user) return '';
  const meta = user.user_metadata as Record<string, string> | null;
  if (meta?.name) return meta.name;
  return user.email?.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  const loadCompanyInfo = useCallback(async (userId: string) => {
    const { data: membership } = await supabase
      .from('company_members')
      .select('company_id, role, name, is_platform_admin, active')
      .eq('user_id', userId)
      .maybeSingle();

    if (membership) {
      setIsPlatformAdmin(!!membership.is_platform_admin);
      setRole(membership.role as UserRole);
      if (membership.company_id && !membership.is_platform_admin) {
        const { data: comp } = await supabase
          .from('companies')
          .select('*')
          .eq('id', membership.company_id)
          .maybeSingle();
        if (comp) setCompany(comp as Company);
      } else {
        setCompany(null);
      }
    } else {
      setRole(null);
      setCompany(null);
      setIsPlatformAdmin(false);
    }
  }, []);

  const reloadCompany = useCallback(async () => {
    if (session?.user) await loadCompanyInfo(session.user.id);
  }, [session, loadCompanyInfo]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadCompanyInfo(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        if (newSession?.user) {
          await loadCompanyInfo(newSession.user.id);
        } else {
          setCompany(null);
          setRole(null);
          setIsPlatformAdmin(false);
        }
        setLoading(false);
      })();
    });

    return () => { sub.subscription.unsubscribe(); };
  }, [loadCompanyInfo]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCompany(null);
    setRole(null);
    setIsPlatformAdmin(false);
  }, []);

  const user = session?.user
    ? { email: session.user.email || '', name: displayName(session.user), id: session.user.id }
    : null;

  return (
    <AuthContext.Provider value={{ user, session, loading, company, role, isPlatformAdmin, signIn, signOut, reloadCompany }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
