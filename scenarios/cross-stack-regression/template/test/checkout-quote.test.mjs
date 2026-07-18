import assert from "node:assert/strict";
import test from "node:test";
import { toQuoteViewModel } from "../client/src/checkout/quote-view-model.mjs";
import { createQuote } from "../server/src/pricing/create-quote.mjs";

test("discounted subtotal determines free shipping eligibility", () => {
  const quote = createQuote({ subtotalCents: 5200, discountCents: 700 });
  assert.equal(quote.discountedSubtotalCents, 4500);
  assert.equal(quote.shippingCents, 700);
  assert.equal(quote.totalCents, 5200);
});

test("checkout displays the shipping field in the service contract", () => {
  const quote = createQuote({ subtotalCents: 4200 });
  assert.deepEqual(toQuoteViewModel(quote), {
    merchandise: "$42.00",
    shipping: "$7.00",
    total: "$49.00"
  });
});
