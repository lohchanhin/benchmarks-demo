# Fresh-Repository V6 Static Smoke Result

## Status

**Negative routing result with one validated contract improvement.**

The current candidate no longer crashes when the adaptive JSON context estimate exceeds the route-lite ceiling. It returned a compact payload in both repetitions. However, it found neither the implementation file nor the focused test on this new repository. This smoke therefore does not qualify the candidate and does not support a Token, speed, or Agent-accuracy claim.

## Frozen method

- The selector mechanically excluded every repository identity observed in the tracked product and benchmark histories.
- GitHub search produced 100 merged pull-request nodes and two eligible fresh candidates.
- A preregistered SHA-256 rank selected `djust-org/djust` PR [#2424](https://github.com/djust-org/djust/pull/2424), linked to issue [#2421](https://github.com/djust-org/djust/issues/2421).
- The base commit, merge commit, task text, hidden oracle commitment, package hashes, and execution order were frozen before any Palace observation.
- Candidate and npm `0.4.0` each ran twice in isolated cold clones, sequentially, with balanced order.

The hidden diff changed exactly three files:

- implementation: `python/djust/components/function_component.py`
- focused test: `python/tests/test_render_slot_markup_2421.py`
- explicit auxiliary evidence: `CHANGELOG.md`

The frozen oracle commitment verified after the four observations.

### Oracle observability correction

A post-result audit found that `python/tests/test_render_slot_markup_2421.py` did not exist at the frozen base commit; the hidden diff created it. The original `0/2` metric is preserved because it was the preregistered calculation, but it combines two different truths:

- base-observable core: `python/djust/components/function_component.py`, missed (`0/1`)
- future-only outcome: `python/tests/test_render_slot_markup_2421.py`, not scoreable as an exact pre-change pathname

The result therefore remains negative: the candidate missed the implementation file that it could have routed. However, future static studies must not require a router to guess a hidden future filename. When the task requires a new file, the oracle must freeze an observable creation surface, such as an existing test directory or sibling suite, before Palace runs. The [machine-readable observability audit](../../results/fresh-repository-v6/oracle-observability-audit.json) records this correction without rewriting the formal result.

## Results

| Measure | Current candidate | npm 0.4.0 baseline |
| --- | ---: | ---: |
| Successful context calls | 2/2 | 0/2 |
| Delivered context | 1,365 estimated Tokens | unavailable |
| Core implementation/test coverage | 0/2 | unavailable |
| Route focus | 0.000 | unavailable |
| Deterministic successful route | yes | unavailable |
| Mean context command time | 93.340 s | 90.453 s to failure |
| Mean cold index time | 746.181 s | 623.926 s |
| Tracked-file pollution | 0 | 0 |

The baseline failed both times with the same contract error: its 4,537-Token estimate exceeded the 2,400-Token route-lite ceiling. The candidate structurally degraded that payload to 1,365 Tokens and returned normally. Because the baseline produced no context, its route, coverage, payload, and condition-difference metrics are **unavailable**, not zero. The first generated summary represented them incorrectly; [the correction record](../../results/fresh-repository-v6/analysis-correction.json) preserves that disclosure.

## What the candidate routed

The two candidate routes were identical and contained eight files, including Rust filter files, a generic README, an old context-safety test, and unrelated Python support files. They omitted all three oracle files. The route reported `route-lite`, confidence `0.21`, insufficient evidence, and `stopEnforced=false`.

This repeatability rules out random route variance as the explanation. It does not make the route correct.

## Mechanism diagnosis

The post-reveal diagnostic found a general failure pattern:

1. The issue body called the regression a “release blocker,” and the task was classified as `release` even though its actual action was a security and regression repair.
2. Task analysis did extract `RenderSlotTagHandler._render_value`, `render_slot`, and the named test file.
3. A direct score probe ranked the exact implementation object strongly, including an exact Room Inventory object match, but final route selection did not preserve it.
4. Broad `render` and `escape` vocabulary in the long issue body then promoted unrelated filter and security files.

The failure is therefore downstream of parsing and object recognition: intent precedence and exact-anchor preservation are the immediate suspects. See the [machine-readable diagnosis](../../results/fresh-repository-v6/mechanism-diagnosis.json).

## Research direction

This disclosed target is now closed for tuning and remains only a regression case. The next product work should be generic:

1. Require an actual publish, tag, or version action before classifying a task as release work; incidental release-risk prose must not outrank repair intent.
2. Preserve exact file, class, method, and function identities as mandatory route anchors across every task type.
3. Treat long issue prose as bounded supporting evidence, not as equal-weight task obligations.
4. Test those invariants with neutral fixtures that contain no repository, issue, or path-specific rule.
5. Investigate cold indexing separately; 10-12 minutes per fresh clone is not acceptable for an interactive workflow.
6. Use another undisclosed repository for the next qualifying observation.
7. Split exact-path truth into base-observable files and preregistered creation surfaces; hidden new files remain outcome evidence, not exact static-route gates.

## Claim boundary

This is one historical task, one repository, and two static repetitions per condition. It validates a bounded-payload behavior and reveals a routing failure. It cannot establish general routing quality, Token savings, speed, or end-to-end repair accuracy.

Raw evidence: [static result](../../results/fresh-repository-v6/static-result.json), [oracle reveal](../../results/fresh-repository-v6/oracle-reveal.json), [selection freeze](../../protocol/v6/freeze.json), and [semantic review](../../protocol/v6/semantic-review.json).
