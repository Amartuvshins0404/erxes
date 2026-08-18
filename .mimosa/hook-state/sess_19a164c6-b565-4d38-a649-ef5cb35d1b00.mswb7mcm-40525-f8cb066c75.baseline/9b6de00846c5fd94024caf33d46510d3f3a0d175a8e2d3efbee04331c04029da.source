export const MEMBERSHIP_PURCHASE_DELETE_WINDOW_MS = 24 * 60 * 60 * 1000;

/** 24-hour deletion window is measured from `purchasedAt`. */
export function isWithinMembershipPurchaseDeleteWindow(
  purchasedAt: string | Date | undefined | null,
): boolean {
  if (!purchasedAt) return false;
  const t = new Date(purchasedAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= MEMBERSHIP_PURCHASE_DELETE_WINDOW_MS;
}
