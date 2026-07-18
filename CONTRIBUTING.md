# Contributing

Contributions are welcome for new scenarios, parsers, and methodology fixes.

Each new scenario must be deterministic, dependency-light, safe to publish,
and include a check proving that its untouched baseline fails while a scoped
canonical repair passes. Scenario tests must not award efficiency points; they
should measure correctness and scope only.

Before opening a pull request, run:

```sh
npm run check
```

Do not commit `.benchmark-runs/` or raw Codex transcripts. Include a redacted
comparison report only when it helps explain a methodology change.
