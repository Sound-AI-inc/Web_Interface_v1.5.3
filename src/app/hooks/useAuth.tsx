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
      console.info("[auth-timing] session_ready", {
        hasSession: Boolean(data.session),
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        if (mounted) setLoading(false);
      }
      if (nextSession?.user) {
        console.info("[auth-timing] auth_state", {
          event,
          userId: nextSession.user.id,
        });
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
