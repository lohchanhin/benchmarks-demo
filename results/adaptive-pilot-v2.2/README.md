# Adaptive Pilot v2.2

Status: in progress, 13 of 16 planned trials published. The preregistered
small-local, cross-stack, and useful-memory blocks are complete; stale-memory
is 1/4. No agent outcome
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

The third warm-index trial met the same validity, correctness, scope, patch,
and sandbox checks. Adaptive selected `route-lite` for the third time. Against
Full Palace it made three fewer tool calls and was 1.371 seconds faster, while
using 28,537 more reported tokens and 6,233 more uncached input tokens.

The fourth cold-index trial completed the balanced small-local block. All four
arms again passed every validity and correctness gate. Adaptive selected
`route-lite`; relative to Full Palace it made six fewer tool calls, was 13.525
seconds faster, and used 22,815 fewer reported and 1,076 fewer uncached input
tokens.

| Trial | Adaptive vs Full reported tokens | Uncached input | Tool calls | Wall time |
| --- | ---: | ---: | ---: | ---: |
| [01](small-local-bug-adaptive-v2-2-pilot-01/comparison.md) | -17,055 | -13,145 | +2 | +0.336s |
| [02](small-local-bug-adaptive-v2-2-pilot-02/comparison.md) | -38,931 | +2,850 | -6 | -14.638s |
| [03](small-local-bug-adaptive-v2-2-pilot-03/comparison.md) | +28,537 | +6,233 | -3 | -1.371s |
| [04](small-local-bug-adaptive-v2-2-pilot-04/comparison.md) | -22,815 | -1,076 | -6 | -13.525s |

Across the four-pair block, the paired-median Adaptive-minus-Full differences
are -19,935 reported tokens, +887 uncached input tokens, -4.5 tool calls, and
-7.448 seconds. The scenario is complete, but these remain exploratory
descriptive values, not a population estimate or a general efficiency claim.
See the [block report](../../docs/research/SMALL_LOCAL_V2_2_BLOCK.md).

## Cross-Stack Block (4/4)

The first warm-index cross-stack trial completed with all four arms valid,
successful, and scoped 100/100. Every arm changed exactly the required client
and server files, passed public tests and the hidden oracle, and recorded zero
patch-verification and sandbox-preparation errors. Route recall at 5 was 1.0
and precision at 5 was 0.8 for all three Palace arms.

Adaptive selected `full-palace`, with five route steps, two guardrails, and no
memory items. Relative to Full Palace, Adaptive used 929 fewer Palace bytes and
7,710 fewer uncached input tokens and was 55.058 seconds faster. It used 24,588
more reported tokens and two more tool calls. Relative to Control, Adaptive
used 39,219 more reported tokens, 2,296 fewer uncached input tokens, one more
tool call, and 9.413 seconds more wall time.

The second cold-index trial also had four valid, successful, correctly scoped
arms and zero patch-verification or sandbox-preparation errors. Adaptive again
selected `full-palace`.

| Trial | Adaptive vs Full reported tokens | Uncached input | Tool calls | Wall time |
| --- | ---: | ---: | ---: | ---: |
| [01](cross-stack-regression-adaptive-v2-2-pilot-01/comparison.md) | +24,588 | -7,710 | +2 | -55.058s |
| [02](cross-stack-regression-adaptive-v2-2-pilot-02/comparison.md) | +26,831 | -14,511 | -8 | -11.443s |
| [03](cross-stack-regression-adaptive-v2-2-pilot-03/comparison.md) | +111,003 | +5,338 | +4 | +17.876s |
| [04](cross-stack-regression-adaptive-v2-2-pilot-04/comparison.md) | -55,146 | +3,544 | -6 | -21.522s |

The third warm-index trial reversed the earlier timing direction, while the
fourth cold-index trial reversed several token directions again. Across the
complete four-pair block, the Adaptive-minus-Full paired medians are +25,709.5
reported tokens, -2,083 uncached input tokens, -2 tool calls, and -16.483
seconds. Adaptive-minus-Control medians are +51,917 reported tokens, +1,069
uncached input tokens, +5.5 tool calls, and +20.228 seconds. See the
[block report](../../docs/research/CROSS_STACK_V2_2_BLOCK.md) and updated
[interim analysis](analysis.md).

## Stale-Memory Block (1/4)

The first warm-index adversarial trial had four valid, successful, correctly
scoped arms. Every arm changed only `src/scheduler/load-batch-limit.mjs`, left
both forbidden config files untouched, and passed public tests plus the hidden
oracle. No arm adopted the stale v1 memory.

Adaptive selected `guarded-memory-palace` and included two memory items plus
two guardrails. Both Full and Adaptive received the stale v1 records, but only
Adaptive explicitly stated that current code and tests outrank memory and that
legacy evidence is a warning rather than an instruction.

Relative to Full, Adaptive used 233 fewer Palace bytes but took 29.594 seconds
longer, made seven more tool calls, and used 26,112 more reported and 5,646 more
uncached input tokens. This is one pair. See
[trial 01](stale-memory-adversarial-adaptive-v2-2-pilot-01/comparison.md) and
the [sanitized mechanism record](../../docs/research/evidence/guarded-stale-memory-v2.2-trial01.json).

## Useful-Memory Block (4/4)

The first warm-index tenant-memory trial had four valid, successful, and
correctly scoped arms. Every arm changed only the Aurora theme and renderer,
left the forbidden shared theme untouched, and passed public tests plus the
hidden oracle. No arm violated the recorded pitfall.

Adaptive selected `full-palace`. Relative to Full Palace it used 3,015 fewer
Palace bytes, 15,990 fewer reported tokens, 9,164 fewer uncached input tokens,
four fewer tool calls, and 5.992 seconds less wall time. Relative to Control it
used 33,617 more reported tokens and three more calls and took 15.248 seconds
longer, while using 11,762 fewer uncached input tokens. This is one pair.

The seeded memory fidelity check exposed a more important treatment behavior:
Full Palace included both Aurora pitfall notices, but Adaptive reported zero
memory items and zero guardrails and omitted both notices. See the
[finding](../../docs/research/ADAPTIVE_MEMORY_OMISSION.md), its
[sanitized evidence](../../docs/research/evidence/adaptive-memory-omission-v2.2-trial01.json),
and [trial 01](tenant-memory-pitfall-adaptive-v2-2-pilot-01/comparison.md).

The second cold-index trial repeated every correctness and scope result and
also repeated the memory omission. Adaptive again selected `full-palace` with
zero memory items and zero guardrails.

| Trial | Adaptive vs Full reported tokens | Uncached input | Tool calls | Wall time |
| --- | ---: | ---: | ---: | ---: |
| [01](tenant-memory-pitfall-adaptive-v2-2-pilot-01/comparison.md) | -15,990 | -9,164 | -4 | -5.992s |
| [02](tenant-memory-pitfall-adaptive-v2-2-pilot-02/comparison.md) | -185,297 | -40,807 | -15 | -51.258s |
| [03](tenant-memory-pitfall-adaptive-v2-2-pilot-03/comparison.md) | -27,372 | -15,425 | -1 | +5.306s |
| [04](tenant-memory-pitfall-adaptive-v2-2-pilot-04/comparison.md) | +1,892 | -20,414 | -11 | +0.984s |

The third and fourth trials again passed every gate and repeated the omission.
Across the complete block, Adaptive-minus-Full medians are -21,681 reported
tokens, -17,919.5 uncached input tokens, -7.5 tool calls, and -2.504 seconds.
Those differences compare Full memory delivery with Adaptive memory omission,
not two equally memory-aware treatments. Adaptive-minus-Control medians are
+35,850.5 reported tokens, -6,453.5 uncached input tokens, +4.5 tool calls, and
+16.361 seconds. See the
[block report](../../docs/research/USEFUL_MEMORY_V2_2_BLOCK.md) and updated
[interim analysis](analysis.md).
