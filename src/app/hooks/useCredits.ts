import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_QUOTA,
  SIGNUP_CREDITS,
  fetchUserCredits,
  upsertUserCredits,
} from "../lib/creditsService";
import { useAuth } from "./useAuth";

export interface CreditsState {
  remaining: number;
  total: number;
  spent: number;
  loading: boolean;
  low: boolean;
  refresh: () => Promise<void>;
  deduct: (amount: number) => Promise<boolean>;
  applyGrant: (balance: number, quota: number) => void;
}

export function useCredits(): CreditsState {
  const { user } = useAuth();
  const [remaining, setRemaining] = useState(SIGNUP_CREDITS);
  const [total, setTotal] = useState(DEFAULT_QUOTA);
  const [spent, setSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setRemaining(SIGNUP_CREDITS);
      setTotal(DEFAULT_QUOTA);
      setSpent(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchUserCredits(user.id);
      if (data) {
        setRemaining(data.balance);
        setTotal(data.quota);
        setSpent(data.spent);
      } else {
        setRemaining(SIGNUP_CREDITS);
        setTotal(DEFAULT_QUOTA);
        setSpent(0);
      }
    } catch {
      setRemaining(SIGNUP_CREDITS);
      setTotal(DEFAULT_QUOTA);
      setSpent(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const applyGrant = useCallback((balance: number, quota: number) => {
    setRemaining(balance);
    setTotal(quota);
  }, []);

  const deduct = useCallback(
    async (amount: number): Promise<boolean> => {
      if (amount <= 0) return true;
      if (remaining < amount) return false;

      const next = remaining - amount;
      const nextSpent = spent + amount;
      setRemaining(next);
      setSpent(nextSpent);

      if (user) {
        const saved = await upsertUserCredits(user.id, next, total, nextSpent);
        if (!saved) {
          setRemaining(remaining);
          setSpent(spent);
          return false;
        }
      }

      return true;
    },
    [remaining, spent, total, user],
  );

  return {
    remaining,
    total,
    spent,
    loading,
    low: remaining / Math.max(total, 1) < 0.2,
    refresh,
    deduct,
    applyGrant,
  };
}
