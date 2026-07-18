import { auroraTheme } from "../../clients/aurora/theme.mjs";
import { borealisTheme } from "../../clients/borealis/theme.mjs";
import { cedarTheme } from "../../clients/cedar/theme.mjs";

const themes = new Map([
  ["aurora", auroraTheme],
  ["borealis", borealisTheme],
  ["cedar", cedarTheme]
]);

export function getClientTheme(clientId) {
  const theme = themes.get(clientId);
  if (!theme) throw new Error(`Unknown client: ${clientId}`);
  return theme;
}
