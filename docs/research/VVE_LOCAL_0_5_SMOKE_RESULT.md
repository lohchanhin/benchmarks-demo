# VVE Local 0.5 Historical-Task Smoke

## Status

**Completed negative result: no candidate advantage was observed.**

This was a local, unblinded diagnostic on one historical four-file repair in a large multitenant monorepo. It compared candidate commit `2b87acd` with public npm `0.4.0`. The repository identity, absolute paths, task symbols, and source content are intentionally omitted from public evidence.

## Method

- Candidate and baseline used the same refreshed Palace index.
- Conditions ran sequentially, never concurrently.
- The natural-language profile described the repair without code identities.
- The explicit-identity profile supplied the real implementation identities and focused-test path.
- Coverage was measured against four historical changed-file roles: backend model, backend service, focused test, and admin UI.
- One warm Context observation was collected per condition and profile. Timing is descriptive only.

## Results

| Profile | Condition | Coverage | Focus | Context Tokens | Context time |
| --- | --- | ---: | ---: | ---: | ---: |
| Natural language | npm 0.4.0 | 25% | 11.1% | 4,699 | 70.074 s |
| Natural language | candidate | 25% | 11.1% | 4,699 | 70.929 s |
| Explicit identity | npm 0.4.0 | 100% | 40.0% | 4,613 | 71.176 s |
| Explicit identity | candidate | 100% | 40.0% | 4,717 | 101.990 s |

Within each profile, candidate and baseline emitted the same normalized route digest. The candidate therefore produced no routing benefit on this target. It also produced no Token or timing benefit; the explicit candidate observation used 104 more estimated Tokens and took longer.

## General findings

1. Natural-language routing remains weak when the task contains no navigable file, class, method, or function identity.
2. Explicit identities materially changed both versions, but the public baseline already reached complete changed-file coverage.
3. The candidate reported top-level selection evidence as `sufficient` while its final route closure remained `insufficient` with two missing explicit symbols. This is a generic contract-ordering inconsistency, not a VVE-specific routing rule to add.
4. Warm Context latency around 70 seconds remains unsuitable for an interactive workflow. A single slower candidate observation is not enough to estimate a stable slowdown, but it clearly provides no positive speed evidence.

## Research boundary

This VVE target is permanently closed for product tuning. The next product change requires a neutral reproduction of the evidence-status inconsistency or a stage-level performance profile. This result does not qualify 0.5 and does not justify an npm update.

Machine evidence: [sanitized result](../../results/vve-local-0.5-smoke/result.json).
