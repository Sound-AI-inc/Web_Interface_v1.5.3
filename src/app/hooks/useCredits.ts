import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

const DEFAULT_CREDITS = 42;
const DEFAULT_TOTAL = 50;

export interface CreditsState {
  remaining: number;
  total: number;
  loading: boolean;
  low: boolean;
  refresh: () => Promise<void>;
  deduct: (amount: number) => Promise<boolean>;
}

export function useCredits(): CreditsState {
  const { user } = useAuth();
  const [remaining, setRemaining] = useState(DEFAULT_CREDITS);
  const [total, setTotal] = useState(DEFAULT_TOTAL);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !user) {
      setRemaining(DEFAULT_CREDITS);
      setTotal(DEFAULT_TOTAL);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_credits")
        .select("balance, quota")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setRemaining(typeof data.balance === "number" ? data.balance : DEFAULT_CREDITS);
        setTotal(typeof data.quota === "number" ? data.quota : DEFAULT_TOTAL);
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits_balance, credits_quota")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          setRemaining(
            typeof profile.credits_balance === "number" ? profile.credits_balance : DEFAULT_CREDITS,
          );
          setTotal(
            typeof profile.credits_quota === "number" ? profile.credits_quota : DEFAULT_TOTAL,
          );
        }
      }
    } catch {
      setRemaining(DEFAULT_CREDITS);
      setTotal(DEFAULT_TOTAL);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const deduct = useCallback(
    async (amount: number): Promise<boolean> => {
      if (amount <= 0) return true;
      if (remaining < amount) return false;

      const next = remaining - amount;
      setRemaining(next);

      const supabase = getSupabase();
      if (supabase && user) {
        void supabase
          .from("user_credits")
          .upsert({ user_id: user.id, balance: next, updated_at: new Date().toISOString() })
          .then(() => undefined);
      }

      return true;
    },
    [remaining, user],
  );

  return {
    remaining,
    total,
    loading,
    low: remaining / Math.max(total, 1) < 0.2,
    refresh,
    deduct,
  };
}
