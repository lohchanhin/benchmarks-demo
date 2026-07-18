# Configuration Migration

Scheduler v2 reads `config/runtime-limits.mjs`. `config/legacy-limits.mjs` is
retained as immutable compatibility data for v1 export and rollback tooling;
runtime fixes must not update it.
