# Vertex Palace Exploratory Pilot Analysis

Planned pilot trials: 16
Attempted trials: 4
Loaded reports: 4

Interim only: 4/16 planned trials are represented. Do not interpret these intervals or p-values as final evidence.

| Scenario | Primary comparison | Valid pairs | Baseline success | Treatment success | Treatment minus baseline (95% bootstrap CI) | Exact p | Holm p |
| --- | --- | ---: | ---: | ---: | --- | ---: | ---: |
| small-local-bug | Adaptive Palace - Full Palace | 4 | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |

## Mutually Successful Pair Efficiency

Paired differences are primary treatment minus primary baseline. Negative values mean the treatment used less of the measured resource; wall time remains secondary.

| Scenario | Metric | Pairs | Baseline median | Treatment median | Paired median difference (95% bootstrap CI) |
| --- | --- | ---: | ---: | ---: | --- |
| small-local-bug | Reported tokens | 4 | 125,144 | 104,377 | -19,935 [-38,931, 28,537] |
| small-local-bug | Uncached input tokens | 4 | 11,702.5 | 12,589.5 | 887 [-13,145, 6,233] |
| small-local-bug | Palace context output bytes | 4 | 2,086 | 1,218 | -868 [-868, -868] |
| small-local-bug | Palace context estimated tokens | 4 | 522 | 305 | -217 [-217, -217] |
| small-local-bug | Tool calls | 4 | 12 | 8 | -4.5 [-6, 2] |
| small-local-bug | Wall time | 4 | 63.5s | 55.7s | -7.4s [-14.6s, 0.3s] |

## Four-Arm Adaptive Contrasts

Each contrast is treatment minus baseline. Negative efficiency values favor the treatment. These secondary mechanism contrasts are exploratory and are not multiplicity-adjusted.

| Scenario | Contrast | Metric | Pairs | Baseline median | Treatment median | Paired median difference (95% bootstrap CI) |
| --- | --- | --- | ---: | ---: | ---: | --- |
| small-local-bug | Route-only - Control | Reported tokens | 4 | 87,360.5 | 121,479 | 34,180.5 [-34,303, 53,647] |
| small-local-bug | Route-only - Control | Uncached input tokens | 4 | 18,918 | 20,717.5 | -620 [-7,372, 7,947] |
| small-local-bug | Route-only - Control | Tool calls | 4 | 4 | 10 | 4.5 [-2, 10] |
| small-local-bug | Route-only - Control | Wall time | 4 | 50.3s | 53.1s | 2.8s [-31.6s, 42.5s] |
| small-local-bug | Full Palace - Route-only | Reported tokens | 4 | 121,479 | 125,144 | 3,376.5 [541, 32,443] |
| small-local-bug | Full Palace - Route-only | Uncached input tokens | 4 | 20,717.5 | 11,702.5 | -3,219.5 [-16,037, 1,039] |
| small-local-bug | Full Palace - Route-only | Palace context output bytes | 4 | 2,086 | 2,086 | 0 [0, 0] |
| small-local-bug | Full Palace - Route-only | Palace context estimated tokens | 4 | 522 | 522 | 0 [0, 0] |
| small-local-bug | Full Palace - Route-only | Tool calls | 4 | 10 | 12 | 0.5 [-5, 9] |
| small-local-bug | Full Palace - Route-only | Wall time | 4 | 53.1s | 63.5s | 8.5s [-15.4s, 19.5s] |
| small-local-bug | Adaptive Palace - Control | Reported tokens | 4 | 87,360.5 | 104,377 | 17,078.5 [16,344, 26,677] |
| small-local-bug | Adaptive Palace - Control | Uncached input tokens | 4 | 18,918 | 12,589.5 | -4,169 [-23,037, 4,135] |
| small-local-bug | Adaptive Palace - Control | Tool calls | 4 | 4 | 8 | 3.5 [-3, 5] |
| small-local-bug | Adaptive Palace - Control | Wall time | 4 | 50.3s | 55.7s | 6.0s [-16.0s, 12.4s] |
| small-local-bug | Adaptive Palace - Full Palace | Reported tokens | 4 | 125,144 | 104,377 | -19,935 [-38,931, 28,537] |
| small-local-bug | Adaptive Palace - Full Palace | Uncached input tokens | 4 | 11,702.5 | 12,589.5 | 887 [-13,145, 6,233] |
| small-local-bug | Adaptive Palace - Full Palace | Palace context output bytes | 4 | 2,086 | 1,218 | -868 [-868, -868] |
| small-local-bug | Adaptive Palace - Full Palace | Palace context estimated tokens | 4 | 522 | 305 | -217 [-217, -217] |
| small-local-bug | Adaptive Palace - Full Palace | Tool calls | 4 | 12 | 8 | -4.5 [-6, 2] |
| small-local-bug | Adaptive Palace - Full Palace | Wall time | 4 | 63.5s | 55.7s | -7.4s [-14.6s, 0.3s] |

Efficiency metrics are calculated only for mutually successful pairs. Raw values and bootstrap intervals are available in the JSON report.

This exploratory pilot does not guarantee that Vertex Palace is faster on every task.
