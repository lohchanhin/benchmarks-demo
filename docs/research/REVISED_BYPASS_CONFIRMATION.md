# Revised Bypass Engineering Confirmation

Status: **five exploratory trials complete; all 20 Agent arms valid and successful**.

[Simplified Chinese](../zh-CN/REVISED_BYPASS_CONFIRMATION.md) |
[Final-command summary](../../results/revised-confirmation/final-command-summary.json) |
[Exact-command summary](../../results/revised-confirmation/exact-command-summary.json) |
[Evidence manifest](../../results/revised-confirmation/manifest.json)

## Why this confirmation exists

The completed 16-trial candidate study found that Adaptive Palace was correct
and tightly scoped, but still used more calls, time, and reported tokens than
Control. Transcript review identified two avoidable behaviors: reopening
`package.json` to discover the test command and splitting final Git checks into
separate calls.

These trials are post-candidate engineering evidence. They do not amend the
completed candidate study and do not add observations to formal v3.

## Intervention sequence

The first trial used bounded execution guidance but only named a "known or
conventional" test command. Adaptive still opened `package.json`. It was valid
and correct, but used one more call, 14,812 more reported tokens, and 14.964
more seconds than Control.

The next candidate resolved the repository's test command inside the single
Palace call and placed `run npm test` in the existing three-field bypass
response. Its packed artifact was bound to source commit
`4b0440cd32270c951b13e83e0d18fd5038e1108f` and SHA-1
`19c8f5452050959ae6a7beb18dc71199a2174a76`.

The final candidate then shortened the bypass rationale and emitted an exact
target-aware Git check. Its artifact was bound to source commit
`a29053f5952131887ff057a8fa7e6777ab045e1f` and SHA-1
`9a04440d7e95c4d34e68e1b7e2cd3f6ecd62e83e`.

## Exact-command pairs

Both exact-command trials passed public tests, the hidden oracle, strict
changed-file scope, task fidelity, and runtime validity in every arm.

| Trial | Order prefix | Adaptive - Control time | Calls | Reported tokens | Inspection commands | Referenced paths |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `exact-command-small-local-02` | Adaptive -> Control | -2.313 s | +1 | +26 | -1 | -2 |
| `exact-command-small-local-03` | Control -> Adaptive | +2.141 s | +2 | +13,315 | -1 | -4 |
| **Paired median** | balanced | **-0.086 s** | **+1.5** | **+6,670.5** | **-1** | **-3** |

Negative time means Adaptive was faster. Positive call or token values mean
Adaptive used more.

## What exact-command improved

- Adaptive selected `bypass` in both pairs and delivered 64 estimated tokens.
- Adaptive opened no package metadata in either pair.
- Adaptive referenced only `src/format-currency.mjs`; Control referenced three
  and five repository paths.
- Adaptive used one fewer inspection command in both pairs.
- The paired median wall-time difference was effectively zero.

## What remains unresolved

The Agent ignored the general instruction to batch final checks. It split
`git diff`, `git status`, and `git diff --check` into two commands in one trial
and three in the other. That preserved a +1 to +2 call overhead even after the
package reread disappeared. Reported-token savings were not demonstrated.

This led to a final candidate that emitted one concrete command rather than
another prose reminder.

## Final-command pairs

The final candidate was tested in two fresh pairs with opposite first-arm
orders. All eight arms passed public tests, the hidden oracle, strict scope,
task fidelity, and runtime validity.

| Trial | Order prefix | Adaptive - Control time | Calls | Reported tokens | Inspection commands | Referenced paths |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `final-command-small-local-04` | Adaptive -> Control | -15.397 s | 0 | -33,698 | -1 | -4 |
| `final-command-small-local-05` | Control -> Adaptive | -3.492 s | +2 | -935 | -1 | -10 |
| **Paired median** | balanced | **-9.445 s** | **+1** | **-17,316.5** | **-1** | **-7** |

Adaptive was faster and used fewer reported and uncached input tokens in both
pairs. It delivered 65 estimated tokens, opened no package metadata, inspected
one file, and referenced only `src/format-currency.mjs` each time. The first
Control arm had one router error and one failed call, which may inflate that
pair's magnitude. The error-free reverse-order pair still favored Adaptive by
3.492 seconds and 935 reported tokens.

## Current boundary

The Agent did not copy the proposed Git checks as one shell call. In both
trials it launched the three checks in parallel during one model turn. Call
batching therefore remains unresolved even though repeated repository
inspection and package-command discovery were removed.

These two pairs are encouraging release-candidate evidence for the small local
`bypass` case, not proof that Vertex Palace generally saves time or Tokens.
They justify a fresh confirmatory study and support shipping the product with
that claim boundary preserved.
