# Three-Minute Demo Guide

## Prepare before recording

1. Run `npm ci` and `npm run benchmark -- doctor`.
2. Validate the frozen study plan and choose one completed trial for display.
3. Execute all three arms with the same model and settings.
4. Review transcripts for secrets and local customer data.
5. Open `reports/comparison.md` and the reviewed three-arm evidence.

Do not make the audience wait for indexing or model execution. Record those
steps separately and edit them into a truthful timeline.

## Suggested timeline

### 0:00-0:20 - Problem

Show the 240-file fixture and explain the cross-layer task: fix one tenant
without changing shared behavior.

### 0:20-0:45 - Experimental control

Show the shared Git tree hash and three prompts. Explain Control, Route-only,
and Full Palace so routing and memory are not conflated.

### 0:45-1:35 - Split-screen execution

Show normal Codex inspection, then the same one-call treatment for Route-only
and Full Palace:

```text
palace context "fix the Aurora article hero contrast regression" \
  --budget 6000 --route-limit 8 --max-drawers 4
```

Pause on either the useful tenant warning or the stale v1 warning. Show that
the current code and external oracle, rather than memory alone, decide success.

### 1:35-2:10 - Correctness

Show public tests, the hidden oracle, forbidden-file result, and Git changed
files for all arms. A speed comparison is meaningful only after correctness.

### 2:10-2:40 - Evidence table

Show the generated comparison and aggregate bootstrap report. Distinguish:

- Codex-reported tokens
- Cached and uncached input tokens
- Failed calls and Codex router errors
- Distinct path strings observed in the transcript
- Command-output characters
- Palace context estimates

Do not call path strings "files read," and do not replace missing values with
invented numbers. When showing performance claims, use all paired trials and
their median rather than a selected single run.

### 2:40-3:00 - Reproduction

Show the public repository, MIT license, frozen protocol tag, and one command:

```text
study --plan results/pilot/plan.json --execute
```

End with the Vertex Palace repository and npm installation path.

## Recording checklist

- Public YouTube video under three minutes
- Audible explanation of how Codex and GPT-5.6 were used
- Repository URL visible
- No private source code, tokens, email addresses, or unreviewed transcripts
- Result table remains on screen long enough to read
