# Vertex Palace Exploratory Pilot Analysis

Planned pilot trials: 16
Attempted trials: 2
Loaded reports: 2

Interim only: 2/16 planned trials are represented. Do not interpret these intervals or p-values as final evidence.

| Scenario | Primary comparison | Valid pairs | Baseline success | Treatment success | Treatment minus baseline (95% bootstrap CI) | Exact p | Holm p |
| --- | --- | ---: | ---: | ---: | --- | ---: | ---: |
| small-local-bug | Adaptive Palace - Full Palace | 2 | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |

## Mutually Successful Pair Efficiency

Paired differences are primary treatment minus primary baseline. Negative values mean the treatment used less of the measured resource; wall time remains secondary.

| Scenario | Metric | Pairs | Baseline median | Treatment median | Paired median difference (95% bootstrap CI) |
| --- | --- | ---: | ---: | ---: | --- |
| small-local-bug | Reported tokens | 2 | 131,847.5 | 103,854.5 | -27,993 [-38,931, -17,055] |
| small-local-bug | Uncached input tokens | 2 | 17,629.5 | 12,482 | -5,147.5 [-13,145, 2,850] |
| small-local-bug | Palace context output bytes | 2 | 2,086 | 1,218 | -868 [-868, -868] |
| small-local-bug | Palace context estimated tokens | 2 | 522 | 305 | -217 [-217, -217] |
| small-local-bug | Tool calls | 2 | 9.5 | 7.5 | -2 [-6, 2] |
| small-local-bug | Wall time | 2 | 59.5s | 52.3s | -7.2s [-14.6s, 0.3s] |

## Four-Arm Adaptive Contrasts

Each contrast is treatment minus baseline. Negative efficiency values favor the treatment. These secondary mechanism contrasts are exploratory and are not multiplicity-adjusted.

| Scenario | Contrast | Metric | Pairs | Baseline median | Treatment median | Paired median difference (95% bootstrap CI) |
| --- | --- | --- | ---: | ---: | ---: | --- |
| small-local-bug | Route-only - Control | Reported tokens | 2 | 87,360.5 | 130,763 | 43,402.5 [33,158, 53,647] |
| small-local-bug | Route-only - Control | Uncached input tokens | 2 | 29,645.5 | 26,908 | -2,737.5 [-7,372, 1,897] |
| small-local-bug | Route-only - Control | Tool calls | 2 | 4 | 12.5 | 8.5 [7, 10] |
| small-local-bug | Route-only - Control | Wall time | 2 | 41.6s | 67.1s | 25.6s [8.7s, 42.5s] |
| small-local-bug | Full Palace - Route-only | Reported tokens | 2 | 130,763 | 131,847.5 | 1,084.5 [541, 1,628] |
| small-local-bug | Full Palace - Route-only | Uncached input tokens | 2 | 26,908 | 17,629.5 | -9,278.5 [-16,037, -2,520] |
| small-local-bug | Full Palace - Route-only | Palace context output bytes | 2 | 2,086 | 2,086 | 0 [0, 0] |
| small-local-bug | Full Palace - Route-only | Palace context estimated tokens | 2 | 522 | 522 | 0 [0, 0] |
| small-local-bug | Full Palace - Route-only | Tool calls | 2 | 12.5 | 9.5 | -3 [-5, -1] |
| small-local-bug | Full Palace - Route-only | Wall time | 2 | 67.1s | 59.5s | -7.7s [-15.4s, 0.1s] |
| small-local-bug | Adaptive Palace - Control | Reported tokens | 2 | 87,360.5 | 103,854.5 | 16,494 [16,344, 16,644] |
| small-local-bug | Adaptive Palace - Control | Uncached input tokens | 2 | 29,645.5 | 12,482 | -17,163.5 [-23,037, -11,290] |
| small-local-bug | Adaptive Palace - Control | Tool calls | 2 | 4 | 7.5 | 3.5 [3, 4] |
| small-local-bug | Adaptive Palace - Control | Wall time | 2 | 41.6s | 52.3s | 10.8s [9.1s, 12.4s] |
| small-local-bug | Adaptive Palace - Full Palace | Reported tokens | 2 | 131,847.5 | 103,854.5 | -27,993 [-38,931, -17,055] |
| small-local-bug | Adaptive Palace - Full Palace | Uncached input tokens | 2 | 17,629.5 | 12,482 | -5,147.5 [-13,145, 2,850] |
| small-local-bug | Adaptive Palace - Full Palace | Palace context output bytes | 2 | 2,086 | 1,218 | -868 [-868, -868] |
| small-local-bug | Adaptive Palace - Full Palace | Palace context estimated tokens | 2 | 522 | 305 | -217 [-217, -217] |
| small-local-bug | Adaptive Palace - Full Palace | Tool calls | 2 | 9.5 | 7.5 | -2 [-6, 2] |
| small-local-bug | Adaptive Palace - Full Palace | Wall time | 2 | 59.5s | 52.3s | -7.2s [-14.6s, 0.3s] |

Efficiency metrics are calculated only for mutually successful pairs. Raw values and bootstrap intervals are available in the JSON report.

This exploratory pilot does not guarantee that Vertex Palace is faster on every task.
