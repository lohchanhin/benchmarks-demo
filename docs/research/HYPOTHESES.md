# Preregistered Hypotheses

These hypotheses are directional claims to be tested, not product promises.

## H1: Correctness Non-Inferiority

Full Palace has a successful-completion rate no more than 10 percentage points
below Control within the fixed execution budget.

- Primary comparison: Full Palace versus Control.
- Outcome: binary protocol-defined success.
- Pilot interpretation: estimation only; five pairs per scenario cannot
  establish non-inferiority with useful power.

## H2: Exploration And Context Efficiency

Among pairs where both arms succeed, Full Palace reduces cumulative context,
tool calls, and repeated exploration relative to Control.

- Metrics: cumulative input tokens, uncached input tokens, tool calls,
  inspection commands, distinct transcript path strings, and output chars.
- Counter-result policy: higher Palace usage must be reported unchanged.

## H3: Useful Historical Memory

Full Palace reduces repeated pitfall violations relative to Route-only and
Control across related tenant tasks.

- Primary memory metric: proportion of runs that modify the protected shared
  file named by the historical pitfall.
- Mechanism contrast: Full Palace versus Route-only.

## H4: Resistance To Harmful Memory

Intentionally stale or wrong memory does not materially increase incorrect
modifications relative to Route-only.

- Metric: wrong-memory adoption and hidden-oracle failure rates.
- A run adopts wrong memory when it changes a preregistered adversarial target
  or implements the stale recommendation detected by the oracle.

## H5: Negative Control

For a small single-file bug, Palace may add setup calls, tokens, and latency
without improving correctness. This expected boundary condition is included to
prevent a universal speed claim.

## Future Scenario Hypotheses

Later protocol versions may add large-repository single-point bugs, release
tasks spanning code/docs/manifests, stale-index recovery, five-task memory
sequences, large refactors, and Markdown/JSON/configuration tasks. Results from
those scenarios cannot be claimed until their contracts are preregistered.
