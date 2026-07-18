const FREE_SHIPPING_THRESHOLD_CENTS = 5000;
const STANDARD_SHIPPING_CENTS = 700;

export function createQuote({ subtotalCents, discountCents = 0 }) {
  const discountedSubtotalCents = Math.max(0, subtotalCents - discountCents);
  const shippingCents = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
    ? 0
    : STANDARD_SHIPPING_CENTS;
  return {
    subtotalCents,
    discountCents,
    discountedSubtotalCents,
    shippingCents,
    totalCents: discountedSubtotalCents + shippingCents
  };
}
