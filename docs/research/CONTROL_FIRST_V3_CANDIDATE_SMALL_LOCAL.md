# Candidate Validation: Small Local Block

Status: **4/16 candidate trials complete; 16 arms attempted; 15 valid; 14 successful**.

This is the first block of the non-formal prepublication 0.3.0 candidate
validation. It does not enter the formal v3 manifest.

## Integrity

- All four preregistered small-local trial IDs, seeds, cache states, and Williams
  orders were used without replacement.
- Public evidence contains 32 checksum-verified files and no raw transcripts,
  local paths, or session identifiers.
- The exact local `vertex-palace@0.3.0` tarball matched the preregistered SHA-1
  and SHA-512 integrity before execution.
- Control, Route-only, Adaptive, and Full ran sequentially, never concurrently.

## Correctness and scope

Trials 01, 02, and 04 were fully comparison-eligible. Every arm in those three
trials passed public tests, the hidden Oracle, and exact changed-file precision
and recall (`1.0 / 1.0`). Adaptive selected true `bypass` in all three eligible
trials and emitted only 177 bytes (about 45 estimated tokens), versus 1,870
bytes (about 468 estimated tokens) from Full Palace.

Trial 03 is retained rather than replaced:

- Control and Route-only were valid and successful.
- Full Palace was treatment-valid but timed out, so it is a failed outcome.
- Adaptive was invalid because Codex never reached the treatment call during a
  network startup failure; therefore the Adaptive-versus-Control primary pair
  is excluded from efficiency and success comparisons.

## Interim paired results

Only three eligible Adaptive-versus-Control pairs exist, so these values are
engineering signals, not final or general claims.

| Comparison | Reported-token paired median | Tool-call paired median | Wall-time paired median |
| --- | ---: | ---: | ---: |
| Adaptive - Control | +14,029 (95% bootstrap CI +12,919 to +14,215) | +2 (CI +1 to +3) | +6.086 s (CI -2.581 to +10.431) |
| Adaptive - Full | -21,261 (CI -92,903 to -2,852) | -2 (CI -8 to +2) | -8.023 s (CI -55.937 to +7.358) |

The current product change is doing what it was designed to do: bypass reduces
the packed Palace payload by 90.5% and materially improves reported tokens
relative to always-on Full Palace in these three pairs. It still does not beat
normal Codex on this deliberately tiny one-file task. Correctness and scope are
equal among the three eligible pairs.

## Infrastructure incident

The Full arm in trial 03 started at `2026-07-20T13:41:54.968Z`. The Windows
System log records Modern Standby beginning at local `2026-07-20 21:43:36`
because of idle timeout and ending at `22:42:28`; the arm ended seconds later
with `timedOut:true`. Adaptive later began during another resume window and its
stderr records DNS resolution failure for `chatgpt.com` before any tool call.

The sanitized power-event record is
[`candidate-small-local-infrastructure-2026-07-21.json`](./evidence/candidate-small-local-infrastructure-2026-07-21.json).
These events expose an unattended-run control missing from the candidate
harness. Before running the remaining blocks, the harness must prevent system
sleep and record that prevention as execution metadata. Trial 03 remains in the
published evidence; it will not be silently rerun or converted into a success.

## Interim decision

Continue development and candidate testing. The block supports true bypass as
a substantial improvement over Full Palace, but it does not support an
efficiency claim versus Control. The remaining cross-stack, decision-memory,
and stale-memory blocks are necessary to evaluate the product's intended value.
