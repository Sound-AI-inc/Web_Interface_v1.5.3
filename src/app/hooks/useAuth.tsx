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
    let timeoutId: ReturnType<typeof setTimeout>;

    const finishLoading = () => {
      if (mounted) setLoading(false);
    };

    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        console.info("[auth-debug] initial getSession", {
          hasSession: Boolean(data.session),
          userId: data.session?.user?.id,
        });
        setSession(data.session);
        timeoutId = setTimeout(finishLoading, 1500);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.info("[auth-debug] onAuthStateChange", {
        event,
        hasSession: Boolean(nextSession),
        userId: nextSession?.user?.id,
      });
      setSession(nextSession);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        clearTimeout(timeoutId);
        finishLoading();
      }
      if (nextSession?.user && (event === "SIGNED_IN" || event === "USER_UPDATED")) {
        void ensureSignupCredits(nextSession.user.id);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
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
