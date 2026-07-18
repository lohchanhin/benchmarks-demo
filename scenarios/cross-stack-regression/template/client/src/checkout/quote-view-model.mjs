import { formatCents } from "../../../shared/src/money.mjs";

export function toQuoteViewModel(quote) {
  return {
    merchandise: formatCents(quote.discountedSubtotalCents),
    shipping: formatCents(quote.shippingAmountCents ?? 0),
    total: formatCents(quote.totalCents)
  };
}
