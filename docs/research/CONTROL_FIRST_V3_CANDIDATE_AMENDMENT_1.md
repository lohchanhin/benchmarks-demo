# Candidate Amendment 1: Unattended System-Awake Guard

Recorded after 4/16 candidate trials and before any cross-stack candidate arm.

Windows System events prove that Modern Standby interrupted small-local trial
03. Because this candidate validation is non-formal and intended to decide
whether a package is ready to publish, the remaining 12 trials will run with a
process-scoped `ES_CONTINUOUS | ES_SYSTEM_REQUIRED` request. The helper does not
keep the display awake and releases the request when each scenario block ends.

This is a post-outcome infrastructure amendment, not part of the original
preregistration. It changes neither product treatment nor experimental task:
trial IDs, seeds, Williams order, cache state, model, reasoning effort, timeout,
package bytes, prompts, tests, and hidden Oracles remain unchanged. No prior
trial is replaced. The failed and invalid arms in trial 03 remain published.

Each later scenario block records guard activation, method, release status, and
block errors in the candidate manifest. A failure to acquire the guard stops
the runner before installation or Agent execution. The formal v3 protocol must
include this control before freeze; this amendment does not modify formal v3.
