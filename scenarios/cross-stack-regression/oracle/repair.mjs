import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const workspace = path.resolve(requiredWorkspace());
await replace(
  "server/src/pricing/create-quote.mjs",
  "const shippingCents = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS",
  "const shippingCents = discountedSubtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS"
);
await replace(
  "client/src/checkout/quote-view-model.mjs",
  "quote.shippingAmountCents ?? 0",
  "quote.shippingCents"
);

async function replace(relative, before, after) {
  const target = path.join(workspace, relative);
  const source = await readFile(target, "utf8");
  const fixed = source.replace(before, after);
  if (fixed === source) throw new Error(`canonical repair pattern was not found in ${relative}`);
  await writeFile(target, fixed, "utf8");
}

function requiredWorkspace() {
  if (!process.argv[2]) throw new Error("workspace argument is required");
  return process.argv[2];
}
