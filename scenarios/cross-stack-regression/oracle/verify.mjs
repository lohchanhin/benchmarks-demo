import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const workspace = path.resolve(requiredWorkspace());
const quoteModule = await load("server/src/pricing/create-quote.mjs");
const viewModule = await load("client/src/checkout/quote-view-model.mjs");

const discounted = quoteModule.createQuote({ subtotalCents: 5000, discountCents: 1 });
assert.equal(discounted.shippingCents, 700);
assert.equal(discounted.totalCents, 5699);
assert.equal(viewModule.toQuoteViewModel(discounted).shipping, "$7.00");

const eligible = quoteModule.createQuote({ subtotalCents: 6000, discountCents: 1000 });
assert.equal(eligible.shippingCents, 0);
assert.equal(eligible.totalCents, 5000);
assert.equal(viewModule.toQuoteViewModel(eligible).shipping, "$0.00");

async function load(relative) {
  const url = pathToFileURL(path.join(workspace, relative)).href;
  return import(`${url}?oracle=${Date.now()}`);
}

function requiredWorkspace() {
  if (!process.argv[2]) throw new Error("workspace argument is required");
  return process.argv[2];
}
