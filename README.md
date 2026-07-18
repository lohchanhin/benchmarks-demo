# Vertex Palace A/B Benchmark

[![CI](https://github.com/lohchanhin/benchmarks-ab-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/lohchanhin/benchmarks-ab-demo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A public, reproducible benchmark for comparing Codex repository work with and
without [Vertex Palace](https://github.com/lohchanhin/vertex-palace).

[Simplified Chinese](README.zh-CN.md) | [Methodology](METHODOLOGY.md) | [Demo guide](DEMO.md)

## Verified paired run

The reproducible GPT-5.6-sol paired run is available at
[docs/results/live-05.md](docs/results/live-05.md). Both arms passed the full
suite with a 100/100 scope score. Palace reduced repository paths appearing in
the transcript from 240 to 13, but it was slower and Codex reported more tokens.
This honest mixed result is one measured sample, not a universal claim.

## Why this exists

Claims about context routing are easy to exaggerate. This repository creates
two disposable workspaces from the same Git tree, gives both Codex arms the
same engineering task, and records evidence from Codex JSONL, Git diff, and a
real test suite.

The Control arm uses normal repository exploration. The Palace arm starts with
status, route, context pack, and a seeded project pitfall. Both arms must solve
the same task and pass the same tests.

## What is measured

- Test result and changed-file scope
- Elapsed Codex execution time
- Tool and inspection command counts
- Repository files explicitly named in Codex command invocations
- Repository paths referenced anywhere in the transcript as a lower-bound audit
- Token usage reported by Codex events, when available
- Control-arm absence and Palace-arm presence of Palace calls
- Optional Vertex Palace route evaluation

Speed and token counts do not affect the correctness score. See
[METHODOLOGY.md](METHODOLOGY.md) for definitions and limitations.

## Included scenario

`tenant-theme-regression` generates a dependency-free, 240-file multi-tenant
JavaScript repository. The task has two independent root causes:

1. Aurora contains a low-contrast tenant color.
2. The renderer ignores an explicit tenant text-color override.

Changing the shared theme or weakening the tests is forbidden. The Palace arm
also receives a realistic prior failure: a shared-theme shortcut previously
changed unrelated tenants.

## Requirements

- Node.js 20 or newer
- Git
- An authenticated Codex CLI

Vertex Palace `0.1.4` is installed locally by `npm ci`; a global Palace install
is not required for the harness.

## Quick start

```sh
git clone https://github.com/lohchanhin/benchmarks-ab-demo.git
cd benchmarks-ab-demo
npm ci
npm run benchmark -- doctor
npm run benchmark -- prepare --run-id demo-01
npm run benchmark -- run --run-dir .benchmark-runs/demo-01 --arm both --model gpt-5.6-sol
npm run benchmark -- report --run-dir .benchmark-runs/demo-01
```

On Windows, when the Store alias for `codex.exe` cannot be launched from a
child process, pass the real CLI path:

```powershell
npm run benchmark -- doctor --codex-bin "$env:CODEX_CLI_PATH"
npm run benchmark -- run --run-dir .benchmark-runs/demo-01 --arm both --codex-bin "$env:CODEX_CLI_PATH"
```

`doctor` reports the exact component that is missing before a paid model run
starts.

The Build Week model is presented as GPT-5.6. In the current Codex CLI for a
ChatGPT account, its accepted command-line identifier is `gpt-5.6-sol`; the
plain `gpt-5.6` identifier returns an unsupported-model error.

## Manual mode

`prepare` writes `INSTRUCTIONS.md` plus separate Control and Palace prompts.
You can open each generated workspace in a fresh Codex task, use the same model
and reasoning settings, and then run:

```sh
npm run benchmark -- verify --run-dir .benchmark-runs/demo-01 --arm both
npm run benchmark -- report --run-dir .benchmark-runs/demo-01
```

Manual runs can prove correctness and Git scope. Copy Codex `--json` output to
the run's `artifacts/*-transcript.jsonl` files when transcript-level efficiency
metrics are also required.

## Artifacts

```text
.benchmark-runs/demo-01/
  manifest.json
  INSTRUCTIONS.md
  prompts/
  arms/
    control/
    palace/
  artifacts/
    control-transcript.jsonl
    palace-transcript.jsonl
    control-evidence.json
    palace-evidence.json
  reports/
    comparison.md
    comparison.json
```

Runs are gitignored because transcripts may contain local paths and session
metadata. Publish only reviewed reports.

## Scoring

Each arm receives up to 100 correctness/scope points:

- 60: complete test suite passes
- 20: both expected root-cause files are changed
- 20: no forbidden or unrelated files are changed and `git diff --check` passes

The report does not manufacture a winner. An arm that violates its mode, fails
tests, or starts from a different tree is marked invalid or receives a lower
score.

## Development

```sh
npm test
npm run test:fixture
npm run check
```

The fixture check proves that the untouched baseline fails and the canonical
two-file repair passes. The project is licensed under the [MIT License](LICENSE).
