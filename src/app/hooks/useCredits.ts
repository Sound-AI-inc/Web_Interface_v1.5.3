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
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setRemaining(SIGNUP_CREDITS);
      setTotal(DEFAULT_QUOTA);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchUserCredits(user.id);
      if (data) {
        setRemaining(data.balance);
        setTotal(data.quota);
      } else {
        setRemaining(SIGNUP_CREDITS);
        setTotal(DEFAULT_QUOTA);
      }
    } catch {
      setRemaining(SIGNUP_CREDITS);
      setTotal(DEFAULT_QUOTA);
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
      setRemaining(next);

      if (user) {
        void upsertUserCredits(user.id, next, total);
      }

      return true;
    },
    [remaining, total, user],
  );

  return {
    remaining,
    total,
    loading,
    low: remaining / Math.max(total, 1) < 0.2,
    refresh,
    deduct,
    applyGrant,
  };
}
