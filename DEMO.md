# Three-Minute Demo Guide

## Prepare before recording

1. Run `npm ci` and `npm run benchmark -- doctor`.
2. Prepare three run IDs so failed recordings do not reuse a dirty workspace.
3. Execute both arms with the same model and settings.
4. Review transcripts for secrets and local customer data.
5. Open `reports/comparison.md` and both Codex transcripts.

Do not make the audience wait for indexing or model execution. Record those
steps separately and edit them into a truthful timeline.

## Suggested timeline

### 0:00-0:20 - Problem

Show the 240-file fixture and explain the cross-layer task: fix one tenant
without changing shared behavior.

### 0:20-0:45 - Experimental control

Show the shared Git tree hash and the two prompts. Highlight the only changed
condition: Palace use.

### 0:45-1:35 - Split-screen execution

On the left, show normal Codex inspection. On the right, show:

```text
palace status
pitfall board
palace route
palace pack
```

Pause briefly on the warning about the previous shared-theme regression, then
show the route reaching the renderer and Aurora configuration.

### 1:35-2:10 - Correctness

Show both test results and Git changed files. A speed comparison is meaningful
only after correctness and scope are visible.

### 2:10-2:40 - Evidence table

Show the generated comparison report. Clearly distinguish:

- Codex-reported tokens
- Transcript-referenced files
- Palace context estimates

Do not replace missing values with invented numbers.

### 2:40-3:00 - Reproduction

Show the public repository, MIT license, and the four commands:

```text
doctor -> prepare -> run -> report
```

End with the Vertex Palace repository and npm installation path.

## Recording checklist

- Public YouTube video under three minutes
- Audible explanation of how Codex and the selected model were used
- Repository URL visible
- No private source code, tokens, email addresses, or unreviewed transcripts
- Result table remains on screen long enough to read
