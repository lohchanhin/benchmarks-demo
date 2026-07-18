# Verified Paired Run: live-05

Date: 2026-07-18

This is a real paired execution produced by the benchmark harness. Raw Codex
transcripts remain private because they contain local filesystem paths. The
comparison below is generated from the sanitized evidence layer.

## Environment

- Scenario: `tenant-theme-regression`
- Shared Git tree: `89dfede1a2381fb4aee25ba929b774b1ee9675bb`
- Generated fixture files: 240
- Model: `gpt-5.6-sol`
- Codex CLI: `0.145.0-alpha.18`
- Vertex Palace: `0.1.4`
- Node.js: `24.13.1`
- Host: Windows

## Task

Fix the Aurora article hero contrast regression while preserving the appearance
of every other tenant. The renderer must honor an explicit tenant text-color
override, the Aurora hero must meet WCAG AA contrast, and the complete test
suite must pass. Tests may not be weakened or rewritten.

## Results

| Metric | Control | Vertex Palace | Control minus Palace |
| --- | ---: | ---: | ---: |
| Tests passed | yes | yes | - |
| Correctness/scope score | 100/100 | 100/100 | - |
| Arm valid | yes | yes | - |
| Elapsed time | 61.2s | 166.6s | -105.3s |
| Tool calls | 5 | 18 | -13 |
| Inspection commands | 3 | 3 | 0 |
| Files named in commands | 9 | 9 | 0 |
| Repository paths in transcript | 240 | 13 | +227 |
| Codex-reported tokens | 156,290 | 444,174 | -287,884 |
| Successful Palace calls | 0 | 7 | - |

Both arms changed exactly:

- `clients/aurora/theme.mjs`
- `src/rendering/article-page.mjs`

Neither arm changed shared theme defaults or tests.

## Interpretation

For this run, Vertex Palace narrowed the repository paths appearing in the
transcript from 240 to 13. It did not reduce files explicitly named in commands,
and it added 105.3 seconds, 13 tool calls, and 287,884 Codex-reported tokens.
Both arms still reached the same correct, narrowly scoped implementation.

This result supports a narrow claim about one paired run on one generated
scenario. It does not establish universal savings. Follow-up experiments
should repeat the pair at least three times, alternate arm order, and report
the median as described in [METHODOLOGY.md](../../METHODOLOGY.md).

## Evidence rules

- Control transcript: zero Palace commands.
- Palace transcript: seven successfully completed Palace commands.
- Both workspaces started from the same recorded Git tree.
- The harness verifier, outside the agent sandbox, ran the same complete test
  command against both final worktrees.
- Token values came from Codex JSONL usage events and are not billing totals.
- File counts came from command invocations and are not an operating-system
  file-access audit.
