export function parseCodexStderr(source = "") {
  const lines = source.split(/\r?\n/).filter(Boolean);
  return {
    stderrChars: source.length,
    warningLines: lines.filter((line) => /\bWARN\b/.test(line)).length,
    errorLines: lines.filter((line) => /\bERROR\b/.test(line)).length,
    routerErrors: lines.filter((line) => /\bERROR\s+codex_core::tools::router:/.test(line)).length,
    applyPatchVerificationErrors: lines.filter((line) => /apply_patch verification failed/i.test(line)).length,
    sandboxPreparationErrors: lines.filter(
      (line) => /failed to prepare (?:fs|windows) sandbox|split writable root sets/i.test(line)
    ).length
  };
}
