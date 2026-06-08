import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { ensureSignupCredits } from "../lib/creditsService";
import { getSupabase, supabaseConfigured } from "../lib/supabase";

const FRESH_SESSION_KEY = "soundai:fresh-session";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  markFreshSession: () => void;
  consumeFreshSession: () => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured());

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
      if (nextSession?.user && (event === "SIGNED_IN" || event === "USER_UPDATED")) {
        void ensureSignupCredits(nextSession.user.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const markFreshSession = useCallback(() => {
    sessionStorage.setItem(FRESH_SESSION_KEY, "1");
  }, []);

  const consumeFreshSession = useCallback(() => {
    const value = sessionStorage.getItem(FRESH_SESSION_KEY);
    if (value) sessionStorage.removeItem(FRESH_SESSION_KEY);
    return Boolean(value);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      configured: supabaseConfigured(),
      markFreshSession,
      consumeFreshSession,
      signOut,
    }),
    [session, loading, markFreshSession, consumeFreshSession, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
