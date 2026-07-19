# Adaptive v2.2 Small-Local Block Report

Status: preregistered scenario block complete (4/4 trials, 16/16 arms).

This report is a descriptive checkpoint inside the 16-trial Adaptive v2.2
study. It is not a final study result and does not establish a general token or
latency advantage.

## Frozen Design

The block used the protocol and plan frozen at tag `protocol-v2.2.0` before any
v2.2 agent outcome existed. Every trial ran the same small single-file repair
under four conditions: Control, Route-only, Full Palace, and Adaptive Palace.
The four Williams orders placed every arm in every sequence position once. Two
trials used a warm local Palace index and two forced a cold rebuild. Arms ran
sequentially with the same model and fixed execution settings.

| Trial | Index | Frozen order |
| --- | --- | --- |
| 01 | warm | Control, Route-only, Adaptive, Full |
| 02 | cold | Route-only, Full, Control, Adaptive |
| 03 | warm | Full, Adaptive, Route-only, Control |
| 04 | cold | Adaptive, Control, Full, Route-only |

## Validity And Correctness

| Gate | Result |
| --- | ---: |
| Valid arms | 16/16 |
| Successful arms | 16/16 |
| Public test passes | 16/16 |
| Hidden-oracle passes | 16/16 |
| Scope score | 100/100 for every arm |
| Sandbox-preparation errors | 0 |
| Native patch-verification errors | 0 |
| Unexpected or forbidden changed files | 0 |

Every arm changed only `src/format-currency.mjs`. Adaptive selected
`route-lite` in all four trials. Route recall at 4 was 1.0 and precision at 4
was 0.5 for every Palace arm.

## Adaptive Versus Full Palace

Negative values favor Adaptive. Token values are cumulative Codex transcript
metrics, not an API billing statement.

| Trial | Reported tokens | Uncached input | Tool calls | Wall time | Palace bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| [01](../../results/adaptive-pilot-v2.2/small-local-bug-adaptive-v2-2-pilot-01/comparison.md) | -17,055 | -13,145 | +2 | +0.336s | -868 |
| [02](../../results/adaptive-pilot-v2.2/small-local-bug-adaptive-v2-2-pilot-02/comparison.md) | -38,931 | +2,850 | -6 | -14.638s | -868 |
| [03](../../results/adaptive-pilot-v2.2/small-local-bug-adaptive-v2-2-pilot-03/comparison.md) | +28,537 | +6,233 | -3 | -1.371s | -868 |
| [04](../../results/adaptive-pilot-v2.2/small-local-bug-adaptive-v2-2-pilot-04/comparison.md) | -22,815 | -1,076 | -6 | -13.525s | -868 |

| Paired metric | Median difference | 95% paired-bootstrap interval |
| --- | ---: | ---: |
| Reported tokens | -19,935 | [-38,931, +28,537] |
| Uncached input tokens | +887 | [-13,145, +6,233] |
| Tool calls | -4.5 | [-6, +2] |
| Wall time | -7.448s | [-14.638s, +0.336s] |
| Palace output bytes | -868 | [-868, -868] |
| Estimated Palace tokens | -217 | [-217, -217] |
| Command-output characters | -2,134.5 | [-2,820, -1,206] |

## Baseline Perspective

Adaptive is smaller than Full Palace, but Control remains the relevant
no-Palace baseline. Adaptive-minus-Control paired medians in this block were:

| Metric | Adaptive minus Control | 95% paired-bootstrap interval |
| --- | ---: | ---: |
| Reported tokens | +17,078.5 | [+16,344, +26,677] |
| Uncached input tokens | -4,169 | [-23,037, +4,135] |
| Tool calls | +3.5 | [-3, +5] |
| Wall time | +6.012s | [-15.959s, +12.424s] |

## Interpretation

1. Adaptive reliably reduced Palace-owned payload: 1,218 bytes versus 2,086
   bytes in every trial.
2. Against Full Palace, Adaptive showed a useful reduction in process overhead
   (calls, command output, and median wall time), but the four-trial intervals
   for calls and time still include zero.
3. Token savings are not established. The reported-token central estimate
   favored Adaptive versus Full, while the uncached-input estimate did not.
4. Adaptive still incurred more reported tokens than Control in this easy
   single-file scenario. This is evidence against claiming universal savings.
5. Correctness cannot distinguish the arms here because all 16 succeeded. The
   remaining cross-stack, useful-memory, and stale-memory blocks are needed to
   test whether routed context earns its overhead on harder tasks.

Provider-side model caching and service load are not controlled. Wall time is
therefore secondary. With only four pairs, the bootstrap intervals are
exploratory and discrete; the raw sanitized evidence and checksums remain the
source of truth in `results/adaptive-pilot-v2.2/`.

## 简体中文摘要

small-local 场景的四组、共 16 个 Arm 已全部有效完成，公开测试、隐藏
Oracle、范围与基础设施检查全部通过。Adaptive 四次都选择 `route-lite`，
相对 Full Palace 的配对中位数显示调用次数和时间有改善信号，但 uncached
input token 没有节省；相对无 Palace 的 Control，Adaptive 仍有额外 reported
token 成本。因此这一区块支持“Adaptive 比 Full 更轻”，不支持“Vertex Palace
在所有简单任务都更快、更省 token”的宣传结论。
