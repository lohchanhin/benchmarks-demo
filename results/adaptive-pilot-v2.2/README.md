# Adaptive Pilot v2.2

Status: preregistered, no agent outcomes collected at protocol freeze.

Protocol v2.2 repeats the four-arm Adaptive study with fresh trial ids and
seeds after correcting a Windows benchmark-harness confound. The frozen plan
records the platform, elevated workspace sandbox, and workspace-local
last-message transport required by every arm.

The earlier v2.1 trial remains public and unchanged, but its efficiency values
are infrastructure-noisy because every arm encountered native `apply_patch`
sandbox failures before using fallbacks. See the
[amendment log](../../docs/research/PROTOCOL_AMENDMENTS.md) and
[harness diagnostics](../../docs/research/HARNESS_DIAGNOSTICS.md).

No v2.2 agent may run before the commit containing this empty manifest is
available at tag `protocol-v2.2.0`.
