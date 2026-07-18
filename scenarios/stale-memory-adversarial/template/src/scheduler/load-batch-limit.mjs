import { legacyLimits } from "../../config/legacy-limits.mjs";

export function loadBatchLimit() {
  return legacyLimits.maxBatch;
}
