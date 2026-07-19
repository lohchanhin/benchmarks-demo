# Adaptive v2.2 Useful-Memory Block Report

Status: preregistered scenario block complete (4/4 trials, 16/16 arms).

This report is a descriptive checkpoint inside the 16-trial Adaptive v2.2
study. It also records a treatment-fidelity limitation discovered after the
first trial: Adaptive did not deliver the seeded memory.

## Frozen Design

Each trial asked the agent to fix an Aurora-only article contrast regression
without changing other tenants. Full and Adaptive Palace received the same
seeded project history: never edit the shared theme for a tenant-only issue,
and remember that the renderer previously ignored tenant text overrides.
Control and Route-only did not receive history.

| Trial | Index | Frozen order |
| --- | --- | --- |
| 01 | warm | Full, Adaptive, Route-only, Control |
| 02 | cold | Adaptive, Control, Full, Route-only |
| 03 | warm | Control, Route-only, Adaptive, Full |
| 04 | cold | Route-only, Full, Control, Adaptive |

## Validity And Correctness

| Gate | Result |
| --- | ---: |
| Valid arms | 16/16 |
| Successful arms | 16/16 |
| Public test passes | 16/16 |
| Hidden-oracle passes | 16/16 |
| Scope score | 100/100 for every arm |
| Pitfall violations | 0/16 |
| Sandbox-preparation errors | 0 |
| Native patch-verification errors | 0 |

Every arm changed only `clients/aurora/theme.mjs` and
`src/rendering/article-page.mjs`. No arm changed the forbidden shared theme.
Route recall at 8 was 1.0 and precision at 8 was 0.5 in every Palace arm.

## Memory Delivery Fidelity

| Field | Full Palace | Adaptive Palace |
| --- | ---: | ---: |
| History seeded during preparation | 4/4 | 4/4 |
| Shared-theme pitfall delivered | 4/4 | 0/4 |
| Renderer failed-attempt delivered | 4/4 | 0/4 |
| Context bytes per trial | 5,465 | 2,450 |
| Adaptive memory items | n/a | 0 in every trial |
| Adaptive guardrails | n/a | 0 in every trial |

Adaptive selected `full-palace` in all four trials but emitted the same
2,450-byte context SHA-256 each time. The omission repeated across fresh seeds,
warm and cold indexes, and every sequence position. See
[`ADAPTIVE_MEMORY_OMISSION.md`](./ADAPTIVE_MEMORY_OMISSION.md).

## Adaptive Versus Full Palace

Negative values favor Adaptive. These comparisons are not an equal-content
test: Full delivered the seeded memory and Adaptive did not.

| Trial | Reported tokens | Uncached input | Tool calls | Wall time | Palace bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| [01](../../results/adaptive-pilot-v2.2/tenant-memory-pitfall-adaptive-v2-2-pilot-01/comparison.md) | -15,990 | -9,164 | -4 | -5.992s | -3,015 |
| [02](../../results/adaptive-pilot-v2.2/tenant-memory-pitfall-adaptive-v2-2-pilot-02/comparison.md) | -185,297 | -40,807 | -15 | -51.258s | -3,015 |
| [03](../../results/adaptive-pilot-v2.2/tenant-memory-pitfall-adaptive-v2-2-pilot-03/comparison.md) | -27,372 | -15,425 | -1 | +5.306s | -3,015 |
| [04](../../results/adaptive-pilot-v2.2/tenant-memory-pitfall-adaptive-v2-2-pilot-04/comparison.md) | +1,892 | -20,414 | -11 | +0.984s | -3,015 |

| Paired metric | Median difference | 95% paired-bootstrap interval |
| --- | ---: | ---: |
| Reported tokens | -21,681 | [-185,297, +1,892] |
| Uncached input tokens | -17,919.5 | [-40,807, -9,164] |
| Tool calls | -7.5 | [-15, -1] |
| Wall time | -2.504s | [-51.258s, +5.306s] |
| Palace output bytes | -3,015 | [-3,015, -3,015] |
| Estimated Palace tokens | -754 | [-754, -754] |
| Command-output characters | -14,928 | [-16,523, -5,387] |

## Baseline Perspective

| Metric | Adaptive minus Control | 95% paired-bootstrap interval |
| --- | ---: | ---: |
| Reported tokens | +35,850.5 | [-122,442, +38,528] |
| Uncached input tokens | -6,453.5 | [-19,206, +1,495] |
| Tool calls | +4.5 | [-2, +8] |
| Wall time | +16.361s | [-66.910s, +36.447s] |
| Command-output characters | -12,535 | [-24,245, -10,250] |

## Interpretation

1. The scenario did not produce a correctness difference. Its task and tests
   made the safe two-file solution discoverable without historical memory.
2. Full Palace delivered the intended entrance pitfall board in all four
   trials. Adaptive did not, despite selecting `full-palace` and despite
   successful history seeding.
3. Adaptive's lower Full-relative context, calls, and uncached input cannot be
   called a memory-aware optimization because the treatments received unequal
   memory content.
4. Adaptive still had higher central wall-time, call, and reported-token values
   than Control. The block does not support universal efficiency claims.
5. Vertex Palace should fix Adaptive memory retrieval in a new release and use
   a harder confirmatory scenario where the pitfall is not restated by tests.

Provider-side caching and load remain uncontrolled. Raw transcripts stay local
because they contain private paths and session metadata; sanitized evidence,
hashes, and checksums are public.

## 简体中文摘要

useful-memory 场景四组、共 16 个 Arm 全部正确，也都没有修改 shared theme。
这代表当前题目太容易从测试推导出安全解法，无法证明历史记忆提升正确性。
同时，Full 四次都收到入口踩坑告示，Adaptive 四次都没有收到，且每次都是
memory 0、guardrail 0。因此 Adaptive 相对 Full 的较低 token 与调用量不能
宣传成“更聪明地使用记忆”，它实际是漏掉了记忆。产品应在新版本修复后，
以新协议和更难的隐藏陷阱场景重新验证。
