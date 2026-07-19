# Data Dictionary

All durations are milliseconds, all token values are Codex-reported cumulative
counts, and all paths are repository-relative POSIX strings.

## Trial Identity

| Field | Type | Meaning |
| --- | --- | --- |
| `trialId` | string | Immutable scenario/seed trial identifier |
| `scenario` | string | Preregistered scenario id |
| `seed` | string | Fixture and arm-order seed |
| `protocolVersion` | string | Frozen protocol version |
| `repositoryTree` | string | Shared tracked Git tree hash |
| `arm` | enum | `control`, `route-only`, `full-palace`, or `adaptive-palace` |
| `sequence` | integer | One-based execution position |
| `cacheState` | enum | `warm` or `cold` local Palace index state at timed start |
| `model` | string | Codex model identifier |
| `reasoningEffort` | string | Requested reasoning effort |
| `codexVersion` | string | Codex CLI version |
| `palaceVersion` | string/null | Vertex Palace version for treatment arms |
| `execution.platform` | string/null | Host platform frozen by successor protocol |
| `execution.sandboxProfile` | string/null | Codex workspace/sandbox profile used by the arm |
| `execution.lastMessageTransport` | string/null | Temporary final-message placement and relocation method |

## Validity And Correctness

| Field | Type | Meaning |
| --- | --- | --- |
| `validity.passed` | boolean/null | Arm followed fixed execution and treatment protocol |
| `taskFidelityPassed` | boolean/null | Palace-rendered `## Task` exactly equals the frozen manifest task |
| `execution.timedOut` | boolean | Agent exceeded the fixed time budget |
| `tests.publicPassed` | boolean | Visible complete test command passed |
| `tests.oraclePassed` | boolean | External hidden oracle passed |
| `success` | boolean | All preregistered primary-success conditions passed |
| `git.changedFiles` | string[] | Tracked/untracked files changed after the agent run |
| `git.changedFilePrecision` | number/null | Expected changed files divided by all changed files |
| `git.changedFileRecall` | number | Expected changed files changed divided by expected files |
| `git.forbiddenViolation` | boolean | At least one forbidden file changed |

## Efficiency And Behavior

| Field | Type | Meaning |
| --- | --- | --- |
| `execution.durationMs` | number/null | Timed Codex process duration |
| `transcript.toolCalls` | number/null | Deduplicated recorded tool/command calls |
| `transcript.failedCalls` | number/null | Recorded failed calls |
| `runtimeDiagnostics.routerErrors` | number/null | Codex router errors parsed from stderr |
| `runtimeDiagnostics.applyPatchVerificationErrors` | number/null | Native patch verification failures parsed from stderr |
| `runtimeDiagnostics.sandboxPreparationErrors` | number/null | Sandbox preparation or split-root failures; frozen at zero for valid v2.2 arms |
| `transcript.inspectionCommands` | number/null | Commands classified as repository inspection |
| `transcript.commandOutputChars` | number/null | Completed command-output character count |
| `transcript.palaceContextOutputChars` | number/null | Character count from the treatment context command stdout |
| `transcript.palaceContextOutputBytes` | number/null | UTF-8 byte count from the treatment context command stdout |
| `transcript.palaceContextEstimatedTokens` | number/null | Common byte-based estimate used across Palace arms |
| `transcript.adaptivePayload` | object/null | Parsed Adaptive mode, self-reported bytes, route tiers, memory, and guardrails |
| `transcript.adaptivePayloadMatchesOutput` | boolean/null | Self-reported Adaptive `contextBytes` exactly equals captured UTF-8 stdout bytes |
| `transcript.palaceReceivedTask` | string/null | Exact task rendered by the Palace command after shell parsing |
| `transcript.referencedFiles` | string[] | Distinct repository path strings observed in JSONL |
| `usage.inputTokens` | number/null | Cumulative input tokens |
| `usage.cachedInputTokens` | number/null | Cumulative cached input tokens |
| `usage.uncachedInputTokens` | number/null | Input minus cached input when not directly reported |
| `usage.outputTokens` | number/null | Cumulative output tokens |

Path strings and command-named files are transcript proxies, not proof that
file contents were read.

## Routing And Memory

| Field | Type | Meaning |
| --- | --- | --- |
| `route.k` | integer/null | Number of ranked route entries evaluated |
| `route.recallAtK` | number/null | Ground-truth route files retrieved at K divided by all ground truth |
| `route.precisionAtK` | number/null | Ground-truth route files retrieved at K divided by K unique files |
| `route.retrievedFiles` | string[] | Unique source paths in ranked route |
| `memory.pitfallViolation` | boolean/null | Historical protected-file mistake repeated |
| `memory.wrongMemoryAdopted` | boolean/null | Preregistered stale recommendation adopted |

## Missingness

`null` means unavailable or not applicable. Zero means a measured count of
zero. Analysis scripts must not replace `null` with zero. Every invalid or
missing arm remains listed in `results/manifest.json` with its reason.
