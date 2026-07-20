# Vertex Palace Control-First Exploratory Analysis

Planned pilot trials: 16
Attempted trials: 12
Loaded reports: 12

Interim only: 12/16 planned trials are represented. Do not interpret these intervals or p-values as final evidence.

Primary comparison: Adaptive Palace versus Control
Primary efficiency metric: cumulative reported tokens

| Scenario | Primary comparison | Valid pairs | Baseline success | Treatment success | Treatment minus baseline (95% bootstrap CI) | Exact p | Holm p |
| --- | --- | ---: | ---: | ---: | --- | ---: | ---: |
| small-local-bug | Adaptive Palace - Control | 3 | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |
| cross-stack-regression | Adaptive Palace - Control | 4 | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |
| decision-memory-dependent | Adaptive Palace - Control | 4 | 75.0% | 100.0% | 25.0% [0.0%, 75.0%] | 1.0000 | 1.0000 |

## Mutually Successful Pair Efficiency

Paired differences are primary treatment minus primary baseline. Negative values mean the treatment used less of the measured resource; wall time remains secondary.

| Scenario | Metric | Pairs | Baseline median | Treatment median | Paired median difference (95% bootstrap CI) |
| --- | --- | ---: | ---: | ---: | --- |
| small-local-bug | Reported tokens | 3 | 87,429 | 100,895 | 14,029 [12,919, 14,215] |
| small-local-bug | Uncached input tokens | 3 | 22,055 | 22,483 | 10,895 [-23,968, 14,058] |
| small-local-bug | Tool calls | 3 | 4 | 6 | 2 [1, 3] |
| small-local-bug | Wall time | 3 | 46.3s | 52.0s | 6.1s [-2.6s, 10.4s] |
| cross-stack-regression | Reported tokens | 4 | 97,929.5 | 136,183 | 30,630.5 [11,218, 53,592] |
| cross-stack-regression | Uncached input tokens | 4 | 14,190 | 24,955 | 10,569.5 [-5,950, 24,710] |
| cross-stack-regression | Tool calls | 4 | 4 | 7 | 3 [2, 6] |
| cross-stack-regression | Wall time | 4 | 53.5s | 68.6s | 11.0s [9.0s, 22.1s] |
| decision-memory-dependent | Reported tokens | 3 | 170,895 | 188,377 | 22,438 [-97,887, 43,196] |
| decision-memory-dependent | Uncached input tokens | 3 | 25,655 | 20,091 | -2,571 [-22,006, -954] |
| decision-memory-dependent | Tool calls | 3 | 9 | 12 | 2 [0, 6] |
| decision-memory-dependent | Wall time | 3 | 144.6s | 100.4s | -44.2s [-77.7s, 14.8s] |

## Four-Arm Control-First Contrasts

Each contrast is treatment minus baseline. Negative efficiency values favor the treatment. These secondary mechanism contrasts are exploratory and are not multiplicity-adjusted.

| Scenario | Contrast | Metric | Pairs | Baseline median | Treatment median | Paired median difference (95% bootstrap CI) |
| --- | --- | --- | ---: | ---: | ---: | --- |
| small-local-bug | Adaptive Palace - Control | Reported tokens | 3 | 87,429 | 100,895 | 14,029 [12,919, 14,215] |
| small-local-bug | Adaptive Palace - Control | Uncached input tokens | 3 | 22,055 | 22,483 | 10,895 [-23,968, 14,058] |
| small-local-bug | Adaptive Palace - Control | Tool calls | 3 | 4 | 6 | 2 [1, 3] |
| small-local-bug | Adaptive Palace - Control | Wall time | 3 | 46.3s | 52.0s | 6.1s [-2.6s, 10.4s] |
| small-local-bug | Adaptive Palace - Full Palace | Reported tokens | 3 | 122,156 | 100,895 | -21,261 [-92,903, -2,852] |
| small-local-bug | Adaptive Palace - Full Palace | Uncached input tokens | 3 | 11,133 | 22,483 | 11,350 [-34,421, 23,077] |
| small-local-bug | Adaptive Palace - Full Palace | Palace context output bytes | 3 | 1,870 | 177 | -1,693 [-1,693, -1,693] |
| small-local-bug | Adaptive Palace - Full Palace | Palace context estimated tokens | 3 | 468 | 45 | -423 [-423, -423] |
| small-local-bug | Adaptive Palace - Full Palace | Tool calls | 3 | 8 | 6 | -2 [-8, 2] |
| small-local-bug | Adaptive Palace - Full Palace | Wall time | 3 | 60.0s | 52.0s | -8.0s [-55.9s, 7.4s] |
| small-local-bug | Route-only - Control | Reported tokens | 4 | 87,702.5 | 103,135 | 9,488.5 [-22,572, 18,218] |
| small-local-bug | Route-only - Control | Uncached input tokens | 4 | 25,898 | 10,012 | -5,835.5 [-22,026, 1,431] |
| small-local-bug | Route-only - Control | Tool calls | 4 | 4 | 8.5 | 3.5 [3, 5] |
| small-local-bug | Route-only - Control | Wall time | 4 | 47.7s | 59.4s | 2.9s [-20.5s, 21.2s] |
| small-local-bug | Full Palace - Route-only | Reported tokens | 3 | 104,561 | 122,156 | 17,595 [14,675, 88,714] |
| small-local-bug | Full Palace - Route-only | Uncached input tokens | 3 | 9,856 | 11,133 | 1,277 [732, 32,479] |
| small-local-bug | Full Palace - Route-only | Palace context output bytes | 3 | 1,870 | 1,870 | 0 [0, 0] |
| small-local-bug | Full Palace - Route-only | Palace context estimated tokens | 3 | 468 | 468 | 0 [0, 0] |
| small-local-bug | Full Palace - Route-only | Tool calls | 3 | 8 | 8 | 1 [-3, 4] |
| small-local-bug | Full Palace - Route-only | Wall time | 3 | 51.7s | 60.0s | -0.1s [-7.1s, 50.8s] |
| cross-stack-regression | Adaptive Palace - Control | Reported tokens | 4 | 97,929.5 | 136,183 | 30,630.5 [11,218, 53,592] |
| cross-stack-regression | Adaptive Palace - Control | Uncached input tokens | 4 | 14,190 | 24,955 | 10,569.5 [-5,950, 24,710] |
| cross-stack-regression | Adaptive Palace - Control | Tool calls | 4 | 4 | 7 | 3 [2, 6] |
| cross-stack-regression | Adaptive Palace - Control | Wall time | 4 | 53.5s | 68.6s | 11.0s [9.0s, 22.1s] |
| cross-stack-regression | Adaptive Palace - Full Palace | Reported tokens | 4 | 135,065 | 136,183 | 1,283.5 [-19,868, 19,881] |
| cross-stack-regression | Adaptive Palace - Full Palace | Uncached input tokens | 4 | 28,660.5 | 24,955 | -2,916 [-16,735, 8,933] |
| cross-stack-regression | Adaptive Palace - Full Palace | Palace context output bytes | 4 | 3,121 | 4,183 | 1,062 [1,062, 1,062] |
| cross-stack-regression | Adaptive Palace - Full Palace | Palace context estimated tokens | 4 | 781 | 1,046 | 265 [265, 265] |
| cross-stack-regression | Adaptive Palace - Full Palace | Tool calls | 4 | 12 | 7 | -4 [-6, 1] |
| cross-stack-regression | Adaptive Palace - Full Palace | Wall time | 4 | 71.0s | 68.6s | -2.5s [-32.7s, 15.1s] |
| cross-stack-regression | Route-only - Control | Reported tokens | 4 | 97,929.5 | 126,450 | 20,260.5 [-5,355, 37,438] |
| cross-stack-regression | Route-only - Control | Uncached input tokens | 4 | 14,190 | 11,209.5 | -1,701.5 [-7,809, 4,284] |
| cross-stack-regression | Route-only - Control | Tool calls | 4 | 4 | 12 | 8 [8, 10] |
| cross-stack-regression | Route-only - Control | Wall time | 4 | 53.5s | 63.9s | 8.8s [4.7s, 16.9s] |
| cross-stack-regression | Full Palace - Route-only | Reported tokens | 4 | 126,450 | 135,065 | 8,615 [-3,308, 36,965] |
| cross-stack-regression | Full Palace - Route-only | Uncached input tokens | 4 | 11,209.5 | 28,660.5 | 14,630 [10,048, 21,153] |
| cross-stack-regression | Full Palace - Route-only | Palace context output bytes | 4 | 3,121 | 3,121 | 0 [0, 0] |
| cross-stack-regression | Full Palace - Route-only | Palace context estimated tokens | 4 | 781 | 781 | 0 [0, 0] |
| cross-stack-regression | Full Palace - Route-only | Tool calls | 4 | 12 | 12 | 0 [-8, 1] |
| cross-stack-regression | Full Palace - Route-only | Wall time | 4 | 63.9s | 71.0s | 8.1s [-9.8s, 30.1s] |
| decision-memory-dependent | Adaptive Palace - Control | Reported tokens | 3 | 170,895 | 188,377 | 22,438 [-97,887, 43,196] |
| decision-memory-dependent | Adaptive Palace - Control | Uncached input tokens | 3 | 25,655 | 20,091 | -2,571 [-22,006, -954] |
| decision-memory-dependent | Adaptive Palace - Control | Tool calls | 3 | 9 | 12 | 2 [0, 6] |
| decision-memory-dependent | Adaptive Palace - Control | Wall time | 3 | 144.6s | 100.4s | -44.2s [-77.7s, 14.8s] |
| decision-memory-dependent | Adaptive Palace - Full Palace | Reported tokens | 4 | 156,681 | 178,427 | 30,432 [-25,931, 40,911] |
| decision-memory-dependent | Adaptive Palace - Full Palace | Uncached input tokens | 4 | 30,390 | 20,763.5 | -11,257 [-16,703, -3,571] |
| decision-memory-dependent | Adaptive Palace - Full Palace | Palace context output bytes | 4 | 4,571 | 6,353 | 1,782 [1,771, 1,797] |
| decision-memory-dependent | Adaptive Palace - Full Palace | Palace context estimated tokens | 4 | 1,143 | 1,589 | 446 [443, 449] |
| decision-memory-dependent | Adaptive Palace - Full Palace | Tool calls | 4 | 12.5 | 11 | -0.5 [-11, 5] |
| decision-memory-dependent | Adaptive Palace - Full Palace | Wall time | 4 | 91.5s | 94.4s | -1.0s [-16.1s, 24.3s] |
| decision-memory-dependent | Route-only - Control | Reported tokens | 1 | 286,264 | 268,474 | -17,790 [-17,790, -17,790] |
| decision-memory-dependent | Route-only - Control | Uncached input tokens | 1 | 35,821 | 30,557 | -5,264 [-5,264, -5,264] |
| decision-memory-dependent | Route-only - Control | Tool calls | 1 | 12 | 12 | 0 [0, 0] |
| decision-memory-dependent | Route-only - Control | Wall time | 1 | 180.4s | 190.2s | 9.8s [9.8s, 9.8s] |
| decision-memory-dependent | Full Palace - Route-only | Reported tokens | 1 | 268,474 | 161,255 | -107,219 [-107,219, -107,219] |
| decision-memory-dependent | Full Palace - Route-only | Uncached input tokens | 1 | 30,557 | 30,518 | -39 [-39, -39] |
| decision-memory-dependent | Full Palace - Route-only | Palace context output bytes | 1 | 3,600 | 4,571 | 971 [971, 971] |
| decision-memory-dependent | Full Palace - Route-only | Palace context estimated tokens | 1 | 900 | 1,143 | 243 [243, 243] |
| decision-memory-dependent | Full Palace - Route-only | Tool calls | 1 | 12 | 7 | -5 [-5, -5] |
| decision-memory-dependent | Full Palace - Route-only | Wall time | 1 | 190.2s | 111.5s | -78.7s [-78.7s, -78.7s] |

## Scope Outcomes Across Valid Primary Pairs

Scope is summarized for every valid Adaptive-Control pair, including runs that did not achieve protocol success.

| Scenario | Arm | Median changed-file precision | Median changed-file recall | Forbidden violations | Discordant success trial IDs |
| --- | --- | ---: | ---: | ---: | --- |
| small-local-bug | Control | 100.0% | 100.0% | 0 | none |
| small-local-bug | Adaptive Palace | 100.0% | 100.0% | 0 | none |
| cross-stack-regression | Control | 100.0% | 100.0% | 0 | none |
| cross-stack-regression | Adaptive Palace | 100.0% | 100.0% | 0 | none |
| decision-memory-dependent | Control | 100.0% | 100.0% | 1 | none |
| decision-memory-dependent | Adaptive Palace | 100.0% | 100.0% | 0 | `decision-memory-dependent-control-first-v3-candidate-01` |

Efficiency metrics are calculated only for mutually successful pairs. Raw values and bootstrap intervals are available in the JSON report.

This exploratory pilot does not guarantee that Vertex Palace is faster on every task.
