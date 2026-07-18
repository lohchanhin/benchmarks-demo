# Protocol Amendments

The protocol was frozen as version 1.0.0 at tag `protocol-v1.0.0` before new
four-scenario pilot data were collected.

## A-001: Post-Pilot Three-Arm And Power Reporting

- Date: 2026-07-19
- Author: project maintainer with Codex
- Timing disclosure: all 20 pilot outcomes had already been inspected.
- Reason: the frozen protocol specified Route-only as a secondary mechanism
  analysis but the original renderer summarized only Full Palace versus
  Control. It also requested an observed-discordance power estimate; all
  primary pairs were concordant successes, making that estimate undefined.
- Old analysis output: Full Palace versus Control scenario summaries and a
  null observed-effect sample-size field.
- New analysis output: the unchanged primary comparison plus exploratory
  Route-only-minus-Control and Full-Palace-minus-Route-only paired summaries;
  power planning uses an explicitly assumed discordance sensitivity grid and
  labels it as post-outcome planning rather than observed evidence.
- Affected data: all four scenarios and all 20 pilot trials are reanalyzed.
  No arm outcome, exclusion, fixture, metric definition, or raw evidence was
  changed or removed.
- Applicability: reporting and planning only; no new hypothesis test is used
  to upgrade an H1-H5 conclusion.
- Commit and tag: the completion commit tagged `pilot-v1-complete`.

## Amendment Template

Each future entry must contain:

- amendment id and date;
- author;
- reason discovered without consulting affected outcome data, or an explicit
  statement that outcome data had already been inspected;
- exact old and new text;
- affected scenarios and first applicable trial id;
- whether prior runs are retained, reanalyzed, or marked incompatible;
- commit and tag containing the amendment.
