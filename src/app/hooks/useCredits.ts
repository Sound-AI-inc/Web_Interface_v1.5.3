import { useCallback, useEffect, useState } from "react";
import { DEFAULT_QUOTA, fetchUserCredits } from "../lib/creditsService";
import { useAuth } from "./useAuth";

export interface CreditsState {
  remaining: number;
  total: number;
  spent: number;
  loading: boolean;
  low: boolean;
  refresh: () => Promise<void>;
  applyGrant: (balance: number, quota: number) => void;
}

export function useCredits(): CreditsState {
  const { user } = useAuth();
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(DEFAULT_QUOTA);
  const [spent, setSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setRemaining(0);
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
      }
    } catch {
      // Keep last backend-confirmed balance. Never invent a local trial grant.
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

  return {
    remaining,
    total,
    spent,
    loading,
    low: remaining / Math.max(total, 1) < 0.2,
    refresh,
    applyGrant,
  };
}