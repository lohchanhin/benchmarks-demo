# Benchmark Harness Diagnostics

This log records infrastructure investigations that affect interpretation of
the benchmark. These checks are development smokes, not benchmark trials, and
must not be pooled with treatment outcomes.

## 2026-07-19: Windows `apply_patch` Sandbox Failure

The first protocol v2.1 trial completed correctly, but all four arms first hit
this Codex router error:

```text
windows unelevated restricted-token sandbox cannot enforce split writable
root sets directly; refusing to run unsandboxed
```

Agents then used slower fallbacks. The number of failed calls differed by arm,
so wall time, tool calls, and cumulative token usage from that trial are noisy
measures of context-routing efficiency.

### Diagnostic Sequence

Four disposable one-file Git repositories were used. Every check asked the
same Codex build and model to change `before` to `after` with native
`apply_patch`. No check is a research outcome.

| Check | Last message | Windows sandbox | Inherited Codex env | Native patch |
|---|---|---|---|---|
| D1 | Inside workspace | unelevated | inherited | failed |
| D2 | Inside workspace | unelevated | permission profile removed | failed |
| D3 | Inside workspace | unelevated | all orchestration variables removed | failed |
| D4 | Inside workspace | elevated | all orchestration variables removed | passed |
| D5 | Inside workspace then relocated | elevated | benchmark pipeline | passed |

This falsified the initial hypothesis that the external last-message path was
the sole cause. The reproducible factor was the Windows unelevated sandbox.
Keeping the temporary last-message file inside the arm workspace is retained
as a simpler one-root transport, but it is not presented as the causal fix.

D4 changed only the requested source file and produced no split-root or native
`apply_patch` failure. It also exposed a separate failed attempt to invoke the
user-global Palace shim under the elevated sandbox. Formal benchmark arms use
the repository-local pinned package, so that result alone was not sufficient.

D5 then exercised the exact Adaptive benchmark pipeline with the repository-
local `vertex-palace@0.2.1`, warm index, `gpt-5.6-sol`, frozen task transport,
elevated sandbox, and workspace-local last-message transport. The Palace call
succeeded once, native `apply_patch` produced no router or sandbox error, only
the expected source file changed, public tests and the hidden oracle passed,
and the temporary last-message file was relocated out of the arm workspace.
This cleared the infrastructure gate for freezing protocol v2.2. D5 remains a
development smoke and is not included in treatment analysis.

### Publication Policy

Raw JSONL and stderr logs remain ignored because they contain Codex session
identifiers and absolute local paths. The sanitized, machine-readable outcome
is published in
[`harness-windows-sandbox-2026-07-19.json`](./evidence/harness-windows-sandbox-2026-07-19.json).
No raw outcome was deleted or rewritten.
