import { getClientTheme } from "../clients/client-registry.mjs";
import { sharedTheme } from "../themes/shared-theme.mjs";

export function resolveArticleTheme(clientTheme = {}) {
  const articleHero = clientTheme.articleHero ?? {};
  return {
    surface: articleHero.surface ?? sharedTheme.articleHero.surface,
    text: sharedTheme.articleHero.text
  };
}
export function renderArticlePage(clientId, title) {
  const theme = resolveArticleTheme(getClientTheme(clientId));
  return {
    title,
    clientId,
    heroStyle: `background:${theme.surface};color:${theme.text}`
  };
}
