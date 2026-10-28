import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '@/lib/supabase';

type AuthState = { session: Session | null; loading: boolean; error: string; retry: () => void };
const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return; }
    let active = true;
    let receivedEvent = false;
    setLoading(true);
    setError('');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      receivedEvent = true;
      setSession(next);
      setLoading(false);
      setError('');
    });
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active || receivedEvent) return;
      if (sessionError) setError(sessionError.message);
      else setSession(data.session);
      setLoading(false);
    }).catch((reason: unknown) => {
      if (active && !receivedEvent) {
        setError(reason instanceof Error ? reason.message : 'Could not restore your session.');
        setLoading(false);
      }
    });
    const refresh = (state: string | null) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    };
    const listener = Platform.OS !== 'web'
      ? AppState.addEventListener('change', refresh) : undefined;
    if (Platform.OS !== 'web') refresh(AppState.currentState);
    return () => {
      active = false;
      subscription.unsubscribe();
      listener?.remove();
      if (Platform.OS !== 'web') supabase.auth.stopAutoRefresh();
    };
  }, [attempt]);
  return <AuthContext.Provider value={{ session, loading, error, retry: () => setAttempt(n => n + 1) }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
