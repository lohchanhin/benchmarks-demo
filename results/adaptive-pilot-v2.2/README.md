# Adaptive Pilot v2.2

Status: in progress, 2 of 16 planned trials published. No agent outcome
existed at protocol freeze.

Protocol v2.2 repeats the four-arm Adaptive study with fresh trial ids and
seeds after correcting a Windows benchmark-harness confound. The frozen plan
records the platform, elevated workspace sandbox, and workspace-local
last-message transport required by every arm.

The earlier v2.1 trial remains public and unchanged, but its efficiency values
are infrastructure-noisy because every arm encountered native `apply_patch`
sandbox failures before using fallbacks. See the
[amendment log](../../docs/research/PROTOCOL_AMENDMENTS.md) and
[harness diagnostics](../../docs/research/HARNESS_DIAGNOSTICS.md).

No v2.2 agent may run before the commit containing this empty manifest is
available at tag `protocol-v2.2.0`.

## Interim Results

The first frozen trial, `small-local-bug-adaptive-v2-2-pilot-01`, ran all four
arms sequentially in the preregistered order. Every arm was valid, changed
only `src/format-currency.mjs`, and passed public tests plus the hidden oracle
with a 100/100 scope score. All arms recorded zero native patch-verification
and sandbox-preparation errors.

Adaptive selected `route-lite`. Relative to Full Palace it used 868 fewer
Palace output bytes, 217 fewer estimated Palace tokens, 17,055 fewer cumulative
reported tokens, and 13,145 fewer uncached input tokens. It also made two more
tool calls and took 0.336 seconds longer.

The second cold-index trial also had four valid, successful, correctly scoped
arms and zero sandbox-preparation errors. Adaptive again selected `route-lite`.

| Trial | Adaptive vs Full reported tokens | Uncached input | Tool calls | Wall time |
| --- | ---: | ---: | ---: | ---: |
| [01](small-local-bug-adaptive-v2-2-pilot-01/comparison.md) | -17,055 | -13,145 | +2 | +0.336s |
| [02](small-local-bug-adaptive-v2-2-pilot-02/comparison.md) | -38,931 | +2,850 | -6 | -14.638s |

Across these two pairs, the paired-median Adaptive-minus-Full differences are
-27,993 reported tokens, -5,147.5 uncached input tokens, -2 tool calls, and
-7.2 seconds. With only 2/16 trials these are interim descriptive values, not
a population estimate or a general efficiency claim. See the
[interim analysis](analysis.md).
