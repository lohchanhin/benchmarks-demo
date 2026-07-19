# Adaptive v2.2 Cross-Stack Block Report

Status: preregistered scenario block complete (4/4 trials, 16/16 arms).

This is a descriptive checkpoint inside the 16-trial Adaptive v2.2 study. It
does not establish a general token, correctness, or latency advantage.

## Frozen Design

The block used the protocol and plan frozen at tag `protocol-v2.2.0` before any
v2.2 outcome existed. Each trial required coordinated changes in a client quote
view model and a server pricing policy while preserving the shared money
contract. The four Williams orders placed each arm in every sequence position
once. Two trials used a warm local Palace index and two forced a cold rebuild.

| Trial | Index | Frozen order |
| --- | --- | --- |
| 01 | warm | Route-only, Full, Control, Adaptive |
| 02 | cold | Full, Adaptive, Route-only, Control |
| 03 | warm | Adaptive, Control, Full, Route-only |
| 04 | cold | Control, Route-only, Adaptive, Full |

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

Every arm changed exactly
`client/src/checkout/quote-view-model.mjs` and
`server/src/pricing/create-quote.mjs`. All Palace arms retrieved both target
files: route recall at 5 was 1.0 and precision at 5 was 0.8 in every trial.

Adaptive selected `full-palace` in all four trials. Its measured payload had
five route steps, two guardrails, and no memory items. It was 2,179 bytes (545
estimated tokens), compared with 3,108 bytes (777 estimated tokens) for Full.

## Adaptive Versus Full Palace

Negative values favor Adaptive. Token values are cumulative Codex transcript
metrics, not an API billing statement.

| Trial | Reported tokens | Uncached input | Tool calls | Wall time | Palace bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| [01](../../results/adaptive-pilot-v2.2/cross-stack-regression-adaptive-v2-2-pilot-01/comparison.md) | +24,588 | -7,710 | +2 | -55.058s | -929 |
| [02](../../results/adaptive-pilot-v2.2/cross-stack-regression-adaptive-v2-2-pilot-02/comparison.md) | +26,831 | -14,511 | -8 | -11.443s | -929 |
| [03](../../results/adaptive-pilot-v2.2/cross-stack-regression-adaptive-v2-2-pilot-03/comparison.md) | +111,003 | +5,338 | +4 | +17.876s | -929 |
| [04](../../results/adaptive-pilot-v2.2/cross-stack-regression-adaptive-v2-2-pilot-04/comparison.md) | -55,146 | +3,544 | -6 | -21.522s | -929 |

| Paired metric | Median difference | 95% paired-bootstrap interval |
| --- | ---: | ---: |
| Reported tokens | +25,709.5 | [-55,146, +111,003] |
| Uncached input tokens | -2,083 | [-14,511, +5,338] |
| Tool calls | -2 | [-8, +4] |
| Wall time | -16.483s | [-55.058s, +17.876s] |
| Palace output bytes | -929 | [-929, -929] |
| Estimated Palace tokens | -232 | [-232, -232] |
| Command-output characters | -4,686.5 | [-9,894, +846] |

## Baseline Perspective

Adaptive is smaller than Full Palace, but Control remains the no-Palace
baseline.

| Metric | Adaptive minus Control | 95% paired-bootstrap interval |
| --- | ---: | ---: |
| Reported tokens | +51,917 | [-20,550, +115,145] |
| Uncached input tokens | +1,069 | [-3,714, +9,620] |
| Tool calls | +5.5 | [+1, +9] |
| Wall time | +20.228s | [+4.240s, +37.687s] |
| Command-output characters | -3,762 | [-6,689, -1,534] |

## Interpretation

1. The router covered the complete cross-stack repair surface in every Palace
   arm, and Adaptive escalated from `route-lite` to `full-palace` as designed.
2. Adaptive reliably reduced Palace-owned payload relative to Full. It also had
   favorable central estimates for wall time, calls, and uncached input versus
   Full, but all three intervals include zero.
3. Reported tokens moved in both directions and had a positive central estimate
   versus Full. Token savings are not established.
4. Against Control, Adaptive took more calls and more wall time in every trial.
   This is direct evidence against a universal efficiency claim.
5. Correctness cannot distinguish the arms in this block because all 16 found
   both required changes. The remaining useful-memory and stale-memory blocks
   must test whether history prevents mistakes that ordinary exploration makes.

Provider-side caching and service load are not controlled, so wall time remains
secondary. The paired-bootstrap intervals are exploratory and discrete at
four pairs. Sanitized evidence and checksums in
`results/adaptive-pilot-v2.2/` remain the source of truth.

## 简体中文摘要

cross-stack 场景四组、共 16 个 Arm 已全部有效完成，每个 Arm 都正确修改
client 与 server 两个文件。Adaptive 四次都升级为 `full-palace`，并稳定缩小
Palace 自身 payload；相对 Full 的时间、调用与 uncached token 中位数较低，
但区间都跨越 0，reported token 中位数反而较高。相对无 Palace 的 Control，
Adaptive 四次都花费更多调用与时间。因此本区块证明路由覆盖完整，却仍不支持
“Vertex Palace 普遍更快、更省 token”的结论。
