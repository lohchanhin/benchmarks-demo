# Real-Repository V4 Results

The formal study is complete: 16/16 paired trials and 32/32 Agent arms.
Outcomes were locked at commit
`cc493b198bdff95138805b18b2b4dff2dec940ee` before the assignment key was
revealed.

[English final report](../../docs/research/REAL_REPOSITORY_V4_FINAL.md) |
[简体中文最终报告](../../docs/zh-CN/REAL_REPOSITORY_V4_FINAL.md)

## Artifact map

| Artifact | Purpose |
| --- | --- |
| [`manifest.json`](manifest.json) | Immutable blinded execution ledger and evidence hashes. |
| [`blinding-reveal.json`](blinding-reveal.json) | Post-lock key, global label mapping, and 32 reproduced assignments. |
| [`analysis.json`](analysis.json) | Reproducible preregistered outcomes and descriptive secondary metrics. |
| [`infrastructure-attempt-costs.json`](infrastructure-attempt-costs.json) | Sanitized retry cost; missing final Token usage remains `null`. |
| [`mechanism-audit.post-hoc.json`](mechanism-audit.post-hoc.json) | Explicitly post-hoc, privacy-sanitized Palace telemetry. |
| `*/evidence.json` | One sanitized public result per completed arm. |
| [`incidents/`](incidents/) | Outcome-free pre-session harness incidents retained for audit. |

The result is negative for the tested product and sample: Adaptive Palace had
3/16 strict successes versus Control's 11/16. Lower descriptive Token totals
did not compensate for the correctness loss. See the final report before
quoting any isolated metric.
