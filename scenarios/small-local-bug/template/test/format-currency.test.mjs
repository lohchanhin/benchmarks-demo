import assert from "node:assert/strict";
import test from "node:test";
import { formatCents } from "../src/format-currency.mjs";

test("formats ordinary integer cent values", () => {
  assert.equal(formatCents(0), "$0.00");
  assert.equal(formatCents(1234), "$12.34");
  assert.equal(formatCents(-125), "-$1.25");
});

test("normalizes negative zero", () => {
  assert.equal(formatCents(-0), "$0.00");
});
