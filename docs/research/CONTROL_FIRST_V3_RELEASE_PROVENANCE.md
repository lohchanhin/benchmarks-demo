# Control-First v3 Release Provenance Gate

Date: 2026-07-20

Machine evidence: [control-first-v3-release-provenance-2026-07-20.json](./evidence/control-first-v3-release-provenance-2026-07-20.json)

## Status

The formal v3 study remains intentionally unfrozen with 0/16 trials and 0/64
Agent arms attempted. This stage adds an executable package-provenance gate; it
does not add an Agent outcome or claim an efficiency improvement.

The reviewed Vertex Palace implementation is commit
`97d1736f971438f7f2913f0b731633b0bab8441d`. The release-candidate HEAD is
`8328ea29d55260e34e2e6170bd420e4c659af39e`; the only change between those
commits is the excluded machine-evidence JSON. Repeated `npm pack --dry-run`
produced the same seven-file `vertex-palace@0.3.0` tarball:

- SHA-1: `4f4f7843cbfebaec0a9f3aade31fac24d96d1133`
- integrity: `sha512-wfxQUxLKk1kQxQm8X1eGKbRaXX/yxIla8KO6PAxj83Fx+7ofwQSzla6tTVvLIlBOxchGy0OmopFdS684GDz9RA==`

Product lint, 89 product tests, build, MCP smoke, clean-package validation, and
pinned Zod and Requests validation passed before publication was attempted.

## Publication Attempt

`npm whoami` succeeded as `lohchanhin`. The subsequent public 0.3.0 publish
reached npm's official browser authorization step, but the authorization was
not completed before the CLI endpoint expired and returned `E404`. Registry
readback still returned 404 for `vertex-palace@0.3.0`; therefore no partial or
ambiguous 0.3.0 release exists. The benchmark dependency remains 0.2.1 until a
fresh interactive authorization succeeds and registry readback is verified.

## New Guardrail

The v3 plan schema is now 6. In addition to the package version and source
commit, it preregisters the release commit, tarball SHA-1, and npm integrity.
Before a formal Agent arm can start, the study runner checks:

1. `package.json` requests the exact preregistered version;
2. the root and package entries in `package-lock.json` request that version;
3. the lock entry resolves to the expected npm tarball;
4. the lock integrity equals the preregistered integrity; and
5. the installed package reports the exact version.

A unit test proves that the gate accepts the exact fixture and rejects a changed
integrity. Before the executable gate was added, the complete benchmark check
passed with 63/63 tests, all five
fixture contracts, every retained evidence audit, the v2.2 analysis
reproduction, and the v3 public manifest still at 0/16.

The follow-up executable gate adds `npm run gate:control-first:v3` and the
combined `npm run check:release-ready`. Its first real run passed 11/19 checks
and failed eight for the expected reasons: public 0.3.0 metadata was absent,
and `package.json` plus both lockfile version entries, tarball URL, and integrity
still described 0.2.1. The installed directory reported 0.3.0, demonstrating
why checking only `node_modules` would have produced a false sense of readiness.
The gate invokes no Codex process and exposes no registry error body or auth URL.
It explicitly queries `https://registry.npmjs.org` and removes the blinded
scenario key from the npm subprocess environment.
The complete suite then passed 65/65 tests with the same fixture, evidence, and
empty-manifest guarantees.

## Route Self-Evaluation

Vertex Palace routed 5/7 changed files (coverage 0.71, focus 0.71, confidence
0.35). It missed `README.zh-CN.md` and the core `src/commands/study.mjs`, so the
assessment remains `needs-review`. The reported 99.6% repository-to-pack token
reduction measures selected context only and is not evidence of lower Agent
tokens or wall time.

The executable-gate follow-up exposed a sharper release-routing weakness. The
default route found 3/11 changed files (coverage 0.27, focus 0.30); a route limit
of 40 found only 4/11 (coverage 0.36) while focus fell to 0.17. Both used
confidence 0.35 and were well calibrated, but both missed the new core
`src/lib/release-gate.mjs` plus most bilingual evidence surfaces. Increasing the
route limit mostly added unrelated fixtures and old memory evidence. This is
direct evidence for future source-to-test-to-script-to-document sibling routing,
not a reason to claim the smaller pack was sufficient.

## Next Gate

With the user present, repeat the official npm browser authorization, verify the
published shasum and integrity from the registry, install exact 0.3.0 into this
repository, run a clean `npm ci` and the complete check, and only then prepare
the private key commitment and protocol freeze commit. No formal arm may run
before that freeze commit is tagged.
