# Fresh-Repository V6 Static Smoke Protocol

V6 is a one-repository, historical-task static smoke test for the current
Vertex Palace development candidate. It is designed to answer a narrow
question: on a repository that has never appeared in the recorded research,
does the candidate route a frozen repair task to the implementation and
focused-test files that were later changed upstream?

This is exploratory evidence, not a release gate or a performance study.

## Selection freeze

1. Extract every GitHub repository identity found in tracked files from both
   the Vertex Palace product repository and this benchmark repository. The
   resulting set is an intentionally conservative exclusion list.
2. Query the first 100 recently updated merged GitHub pull requests that close
   an issue.
3. Mechanically retain public, active, non-fork repositories whose primary
   language is JavaScript, TypeScript, Python, Go, or Rust; whose size and
   activity fit the frozen limits; and whose pull request changes 2-8 files and
   at most 500 lines, including at least one implementation file and one test.
4. Exclude automation, release, documentation-only, build, CI, and dependency
   pull requests.
5. Select the candidate with the smallest
   `SHA-256(seed + "\n" + pull-request URL)` value.
6. Freeze the complete eligible pool digest, random seed, repository, parent
   and merge commits, task text, candidate CLI digest, public baseline npm
   shasum, upstream diff digest, and a commitment to the private oracle before
   any target-level Palace call.

The selected target cannot be replaced after its identity is revealed. If it
is semantically incoherent, unavailable, or unsupported, that failure is the
result.

## Static execution

- Candidate and public `vertex-palace@0.4.0` run twice each in sequential,
  balanced order from the same parent commit.
- Every observation starts in a clean isolated clone with no pre-existing
  `.palace` directory.
- The exact frozen issue task is sent with `referencePolicy=off`; its full text
  is already local and frozen.
- The upstream merge diff remains unavailable to Palace and supplies the
  implementation, focused-test, and auxiliary truth.
- Raw context payloads stay under ignored `.benchmark-runs/`; committed results
  contain measurements and route paths, not local transcripts.

## Descriptive gates

The candidate smoke passes when both calls succeed, produce identical route
files and mode, stay within 6,000 estimated context tokens, leave no tracked
files dirty, cover at least half of the frozen core files, route at least one
implementation and one focused test, and achieve route focus of at least 0.40.

These thresholds describe this smoke only. A pass or failure cannot establish
general routing quality, Token savings, speed, or Agent repair accuracy.

