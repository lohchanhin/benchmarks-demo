# Control-First v3 Agent Preflight

Date: 2026-07-20 (UTC+08:00)

Status: non-formal engineering preflight. These two trials are not members of
the public v3 manifest, the v3 plan remains `frozen:false`, and no inferential
claim is made.

[Simplified Chinese](../zh-CN/CONTROL_FIRST_V3_AGENT_PREFLIGHT.md) |
[Machine evidence](./evidence/control-first-v3-agent-preflight-2026-07-20.json)

## Research Question

The product contract had already shown that Vertex Palace 0.3.0 can emit a
three-field bypass and deliver relevant guarded memory. This preflight asked a
harder question: does that contract improve a complete Codex run relative to
normal Control exploration?

Both runs used `gpt-5.6-sol`, xhigh reasoning, Codex CLI
`0.145.0-alpha.18`, Vertex Palace 0.3.0 from the source candidate, sequential
execution, identical Git trees within a run, public tests, a hidden oracle, and
strict changed-file precision and recall. The runs used different fixtures and
cache states and must not be pooled.

## Preflight 1: Small Local Bypass

Order: Full Palace -> Adaptive -> Route-only -> Control. Cache: warm.

All four arms passed every correctness, validity, and scope gate and changed
only `src/format-currency.mjs`. Adaptive selected `bypass`; the delivered
Palace output was 177 bytes, about 45 tokens, and contained only mode, primary
candidate, and reason.

| Metric | Control | Adaptive | Adaptive minus Control |
| --- | ---: | ---: | ---: |
| Scope score | 100/100 | 100/100 | equal |
| Tool calls | 5 | 11 | +6 |
| Inspection commands | 2 | 4 | +2 |
| Uncached input tokens | 19,545 | 20,914 | +1,369 |
| Output tokens | 1,595 | 1,781 | +186 |
| Reported tokens | 104,596 | 119,207 | +14,611 |
| Wall time | 48.754 s | 54.216 s | +5.462 s |

The bypass transport contract passed, but end-to-end efficiency did not. The
Adaptive agent called Palace, then split repository and validation checks into
more commands than Control. This is direct evidence that reducing the initial
payload does not automatically constrain later exploration.

## Preflight 2: Historical Tenant Ownership

Order: Full Palace -> Adaptive -> Control -> Route-only. Cache: cold.

The unmodified fixture passes public tests but fails the hidden oracle. Public
code presents several plausible tenant-owned token files; seeded project
history identifies the intended owner. Correctness requires a one-file Aurora
change and unchanged shared, sibling, resolver, API, and tests.

| Arm | Hidden oracle | Scope | Changed file | Calls | Reported tokens | Wall time |
| --- | --- | ---: | --- | ---: | ---: | ---: |
| Control | pass | 100/100 | Aurora | 10 | 310,115 | 159.458 s |
| Route-only | **fail** | 0/100 | Borealis | 23 | 236,146 | 179.842 s |
| Full Palace | pass | 100/100 | Aurora | 27 | 233,159 | 140.076 s |
| Adaptive | pass | 100/100 | Aurora | 12 | 133,334 | 92.766 s |

Adaptive selected `guarded-memory-palace`, delivered 2 included / 2 candidate /
0 excluded memories, three guardrails, and promoted Aurora to the only Primary
file. Relative to Control in this one run, Adaptive used 176,781 fewer reported
tokens, 10,007 fewer uncached input tokens, and 66.692 fewer seconds, while
using two more tool calls.

This is favorable descriptive evidence, not proof of a Control advantage or
Palace advantage. Control also chose Aurora correctly. The preregistered
discordant outcome, Control fail / Adaptive pass or Control scope violation /
Adaptive clean scope, did not occur. Route-only failed while both memory arms
succeeded, so the run distinguishes guarded memory from structure-only routing
but does not distinguish it from normal Codex reasoning.

## Harness Corrections Preserved

The preflight found three measurement defects before protocol freeze:

1. Compact bypass was initially marked invalid because the transcript parser
   expected a full context-pack header and echoed task. It now verifies the
   exact task from the recorded command and measures the compact output.
2. Cold Palace state appeared as untracked `.palace/` and was initially scored
   as an unexpected source change. Raw Git status is still retained, while
   root `.palace` is explicitly classified as benchmark instrumentation. No
   other untracked path receives this exemption.
3. The old parser did not understand v0.3's `included / candidates / excluded`
   memory line. It now records 2 / 2 / 0 instead of `null` and remains backward
   compatible with the old `items / tokens` line.

The product candidate independently fixes future cold runs by adding
`/.palace/` to local `.git/info/exclude` without editing tracked `.gitignore`.
The packed-install gate confirms clean Git status after `palace context --auto`.

## Current Conclusion

- **Memory fidelity:** supported at the mechanism level in this preflight;
  Adaptive delivered both relevant records.
- **True bypass:** supported at the payload level; the response was 177 bytes.
- **Small-task efficiency:** not supported; Adaptive was slower, more
  call-heavy, and used more reported tokens in the single trial.
- **Memory correctness versus Route-only:** supported by one discordant run.
- **Memory correctness versus Control:** not established because both passed.
- **General efficiency:** not established; two non-formal trials cannot support
  a pooled or inferential claim.

The Palace closeout evaluation for this 15-file harness-and-publication change
matched only 1/15 actual files: changed-file coverage 0.07, route focus 0.10,
confidence 0.35, and overconfidence error 0.28. It classified the task as a
release, selected old memory evidence and package manifests, and missed nearly
all harness, regression, localization, and new evidence files. This negative
self-evaluation is further evidence that broad multi-surface maintenance
routing remains unresolved.

## Next Protocol Direction

1. Apply the same explicit completion criteria to every arm so prompt quality
   is not a hidden confound. Adaptive must additionally obey the route's
   Primary, Deferred, Do Not, and Stop Condition contract.
2. Randomize the historical tenant owner by seed. The public fixture must not
   reveal the assignment; seeded memory and the hidden oracle share it. This
   removes repeated Aurora naming as a favorable guess.
3. Use fresh IDs and seeds with balanced sequential order. Provider-side load
   remains uncontrolled, so wall time stays secondary.
4. Keep Adaptive versus Control as primary. Correctness, hidden oracle, and
   exact scope are gates; paired cumulative reported tokens are the primary
   efficiency outcome only among mutually successful valid pairs.
5. Freeze and tag the revised plan before formal runs. These preflight outcomes
   will remain outside the formal manifest.

## Audit Boundary

Raw transcripts stay local because they can contain paths and session
metadata. The public JSON contains run IDs, seeds, trees, arm outcomes,
instrumentation classification, and measured aggregates without local paths or
session IDs. Positive and negative observations are kept together.
