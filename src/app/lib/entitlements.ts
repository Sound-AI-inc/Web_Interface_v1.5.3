export interface PlanEntitlement {
  id: string;
  name: string;
  price: string;
  interval: string;
  billingNote?: string;
  credits: number;
  monthlyAllowance: number;
  refillEnabled: boolean;
  creditPackages?: Array<{ credits: number; price: string }>;
  features: {
    interface: Array<"lite" | "pro">;
    audio: "basic" | "advanced" | "advanced+plugins" | "enterprise";
    export: Array<"mp3" | "wav" | "midi" | "vst" | "all">;
    library: "500mb" | "10gb" | "full" | "enterprise";
    support: "community" | "email" | "priority" | "247";
  };
}

export const PLANS: Record<string, PlanEntitlement> = {
  trial: {
    id: "trial",
    name: "Free Trial",
    price: "$0",
    interval: "7 days",
    credits: 20,
    monthlyAllowance: 20,
    refillEnabled: true,
    features: {
      interface: ["lite"],
      audio: "basic",
      export: ["mp3"],
      library: "500mb",
      support: "community",
    },
  },
  standard: {
    id: "standard",
    name: "Standard",
    price: "$7",
    interval: "one-time",
    billingNote: "$84/year",
    credits: 30,
    monthlyAllowance: 30,
    refillEnabled: true,
    features: {
      interface: ["lite"],
      audio: "advanced",
      export: ["wav"],
      library: "10gb",
      support: "email",
    },
  },
  premium: {
    id: "premium",
    name: "Premium Flex",
    price: "$50",
    interval: "month",
    credits: 50,
    monthlyAllowance: 50,
    refillEnabled: true,
    creditPackages: [
      { credits: 50, price: "$50" },
      { credits: 100, price: "$85" },
      { credits: 500, price: "$380" },
      { credits: 1000, price: "$700" },
      { credits: 3000, price: "$1800" },
    ],
    features: {
      interface: ["lite", "pro"],
      audio: "advanced+plugins",
      export: ["wav", "midi", "mp3"],
      library: "full",
      support: "priority",
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    interval: "custom",
    credits: 0,
    monthlyAllowance: 0,
    refillEnabled: false,
    features: {
      interface: ["lite", "pro"],
      audio: "enterprise",
      export: ["all"],
      library: "enterprise",
      support: "247",
    },
  },
} as const;

export function getPlan(id: string): PlanEntitlement | undefined {
  return PLANS[id];
}

export function hasFeature(planId: string, feature: keyof PlanEntitlement["features"], value: string): boolean {
  const plan = PLANS[planId];
  if (!plan) return false;
  const values = plan.features[feature];
  if (Array.isArray(values)) return (values as readonly unknown[]).includes(value);
  return values === value;
}
