export function formatCents(cents) {
  if (!Number.isSafeInteger(cents)) throw new TypeError("cents must be a safe integer");
  const amount = cents / 100;
  const sign = amount < 0 || Object.is(amount, -0) ? "-" : "";
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
}
