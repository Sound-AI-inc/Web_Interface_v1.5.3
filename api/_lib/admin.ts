const ADMIN_ENABLED = process.env.CREDIT_TEST_ADMIN_ENABLED === "true";
const ADMIN_EMAILS = (process.env.CREDIT_TEST_ADMIN_EMAIL || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
const ADMIN_BALANCE = Number(process.env.CREDIT_TEST_ADMIN_BALANCE ?? 5000);

export function isAdminUser(email: string | undefined | null): boolean {
  if (!ADMIN_ENABLED || !email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export function getAdminBalance(): number {
  if (!ADMIN_ENABLED) return 0;
  return Number.isFinite(ADMIN_BALANCE) ? ADMIN_BALANCE : 5000;
}
