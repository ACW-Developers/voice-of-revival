export function requireLivePayment<T extends { livemode?: boolean }>(payment: T): T {
  if (payment.livemode !== true) {
    throw new Error("Live payments are not configured. Please contact Voice of Revival.");
  }
  return payment;
}