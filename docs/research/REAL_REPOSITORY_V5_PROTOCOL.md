# Real-Repository V5 Protocol

V5 evaluates the frozen Vertex Palace development candidate on twelve fresh historical repairs from Click, Cobra, fd, and Vitest. It separates static routing qualification from end-to-end Agent claims.

## Target selection

- Fetch up to 250 recently merged pull requests per repository through the GitHub GraphQL API.
- Require a linked closing issue, 2-8 changed files, no more than 500 changed lines, at least one implementation file, and at least one focused test file.
- Exclude dependency bots and release, documentation-only, build, CI, or dependency-update titles.
- Rank every eligible pull request with `SHA-256(seed + repository + pull-request URL)`.
- Select one local-complete, one reference-grounded, and one high-connectivity target per repository. A high-connectivity target changes at least four files.
- Freeze the issue, parent commit, merge commit, candidate source commit, selection seed, artifact hashes, and a commitment to the private diff oracle before any selected task is sent to Palace.
- Selected targets cannot be replaced after an outcome is observed.
- Before any target-level Palace call, review each complete issue and pull-request diff as one semantic unit. Record immutable verdicts and diff commitments in `protocol/v5/semantic-review.json`; one unrelated or uncertain target invalidates the round.

## Static qualification

Run the development candidate and public npm `0.4.0` twice per target in balanced sequential order. The merge diff is hidden from Palace and supplies implementation, focused-test, and auxiliary truth.

The development candidate passes only when macro core coverage is at least 0.90, macro route focus is at least 0.70, every target has coverage at least 0.50 and focus at least 0.40, every repeated route is deterministic, no context exceeds 6,000 estimated tokens, and no tracked target file is polluted.

## Agent gate

Only a passing static candidate advances to isolated paired Codex Agent runs. Each target then receives one sequential balanced Palace/Control pair at the same parent commit. The hidden evaluator checks target tests, changed-file scope, and the committed diff oracle. Correctness is primary; reported Tokens, tool calls, and wall time are secondary. No performance claim is allowed unless the paired 95% interval is wholly favorable while correctness remains non-inferior.

## Claim boundary

Static failure blocks Agent execution and supports only a routing diagnosis. A completed 24-arm Agent run supports conclusions for this sample only. It does not establish universal Token or speed improvement.
