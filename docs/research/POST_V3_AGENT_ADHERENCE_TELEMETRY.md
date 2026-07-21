# Post-v3 Agent-Adherence Telemetry

Status: engineering instrumentation for the planned v4 study. Frozen v1, v2.2, and v3 outcomes are unchanged.

## Recorded fields

Each newly verified arm can record:

| Field | Operational definition |
| --- | --- |
| `deliveredFullPathReopenedCount` | Command/path pairs that inspect a `full_file` or `full_symbol` drawer after it was delivered in Routed Context. |
| `deferredOpenedWithoutConflictCount` | Deferred command/path pairs opened before a failed call or transcript conflict signal appeared. |
| `excludedPathOpenedCount` | Excluded command/path pairs later named by inspection commands. |
| `toolCallsBeforeFirstEdit` | Ordered command and tool calls before the first detected edit command. |
| `toolCallsAfterTestsPassed` | Calls after the first successful test command following the final detected edit. |
| `callsAfterStopConditionSatisfied` | Calls after successful tests and a successful combined `git diff --check` plus `git status` scope check. |
| `batchedVerificationUsed` | A successful command contained at least two verification classes, such as test plus lint. |
| `repeatedTaskRestatementCount` | High-coverage task restatements in Agent messages beyond the first occurrence. |

The generated comparison report includes these values for every arm and numeric primary-comparison deltas where both arms are mutually successful.

## Interpretation boundary

These fields are deterministic transcript heuristics, not semantic intent classification and not an operating-system file-access audit. They diagnose likely execution overhead. They do not, by themselves, prove that Palace saves tokens or time.
