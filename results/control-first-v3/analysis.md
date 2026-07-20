# Vertex Palace Control-First Exploratory Analysis

Planned pilot trials: 16
Attempted trials: 7
Loaded reports: 7

Interim only: 7/16 planned trials are represented. Do not interpret these intervals or p-values as final evidence.

Primary comparison: Adaptive Palace versus Control
Primary efficiency metric: cumulative reported tokens

| Scenario | Primary comparison | Valid pairs | Baseline success | Treatment success | Treatment minus baseline (95% bootstrap CI) | Exact p | Holm p |
| --- | --- | ---: | ---: | ---: | --- | ---: | ---: |
| small-local-bug | Adaptive Palace - Control | 4 | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |
| cross-stack-regression | Adaptive Palace - Control | 3 | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |

## Mutually Successful Pair Efficiency

Paired differences are primary treatment minus primary baseline. Negative values mean the treatment used less of the measured resource; wall time remains secondary.

| Scenario | Metric | Pairs | Baseline median | Treatment median | Paired median difference (95% bootstrap CI) |
| --- | --- | ---: | ---: | ---: | --- |
| small-local-bug | Reported tokens | 4 | 87,992.5 | 86,419.5 | -1,443.5 [-37,997, 38] |
| small-local-bug | Uncached input tokens | 4 | 12,048.5 | 15,025 | 1,678.5 [-4,276, 19,060] |
| small-local-bug | Tool calls | 4 | 4.5 | 5 | 0.5 [-2, 2] |
| small-local-bug | Wall time | 4 | 46.5s | 41.2s | -3.7s [-25.9s, 3.0s] |
| cross-stack-regression | Reported tokens | 3 | 90,731 | 77,676 | -12,902 [-27,995, 2,429] |
| cross-stack-regression | Uncached input tokens | 3 | 13,072 | 19,335 | 1,086 [-2,204, 10,410] |
| cross-stack-regression | Tool calls | 3 | 4 | 3 | -1 [-1, 0] |
| cross-stack-regression | Wall time | 3 | 38.7s | 44.9s | 6.2s [-6.1s, 10.7s] |

## Four-Arm Control-First Contrasts

Each contrast is treatment minus baseline. Negative efficiency values favor the treatment. These secondary mechanism contrasts are exploratory and are not multiplicity-adjusted.

| Scenario | Contrast | Metric | Pairs | Baseline median | Treatment median | Paired median difference (95% bootstrap CI) |
| --- | --- | --- | ---: | ---: | ---: | --- |
| small-local-bug | Adaptive Palace - Control | Reported tokens | 4 | 87,992.5 | 86,419.5 | -1,443.5 [-37,997, 38] |
| small-local-bug | Adaptive Palace - Control | Uncached input tokens | 4 | 12,048.5 | 15,025 | 1,678.5 [-4,276, 19,060] |
| small-local-bug | Adaptive Palace - Control | Tool calls | 4 | 4.5 | 5 | 0.5 [-2, 2] |
| small-local-bug | Adaptive Palace - Control | Wall time | 4 | 46.5s | 41.2s | -3.7s [-25.9s, 3.0s] |
| small-local-bug | Adaptive Palace - Full Palace | Reported tokens | 4 | 114,557.5 | 86,419.5 | -28,380.5 [-36,568, -17,975] |
| small-local-bug | Adaptive Palace - Full Palace | Uncached input tokens | 4 | 13,055.5 | 15,025 | -54.5 [-14,614, 21,001] |
| small-local-bug | Adaptive Palace - Full Palace | Palace context output bytes | 4 | 1,870 | 259 | -1,611 [-1,611, -1,611] |
| small-local-bug | Adaptive Palace - Full Palace | Palace context estimated tokens | 4 | 468 | 65 | -403 [-403, -403] |
| small-local-bug | Adaptive Palace - Full Palace | Tool calls | 4 | 8 | 5 | -3 [-5, 1] |
| small-local-bug | Adaptive Palace - Full Palace | Wall time | 4 | 59.1s | 41.2s | -14.0s [-25.0s, -5.6s] |
| small-local-bug | Route-only - Control | Reported tokens | 4 | 87,992.5 | 113,241.5 | 17,105 [13,617, 34,918] |
| small-local-bug | Route-only - Control | Uncached input tokens | 4 | 12,048.5 | 11,655 | 257 [-5,588, 5,556] |
| small-local-bug | Route-only - Control | Tool calls | 4 | 4.5 | 7 | 2.5 [1, 4] |
| small-local-bug | Route-only - Control | Wall time | 4 | 46.5s | 50.0s | 5.1s [-1.9s, 9.0s] |
| small-local-bug | Full Palace - Route-only | Reported tokens | 4 | 113,241.5 | 114,557.5 | -7,527.5 [-15,693, 18,461] |
| small-local-bug | Full Palace - Route-only | Uncached input tokens | 4 | 11,655 | 13,055.5 | 1,315.5 [-7,988, 16,738] |
| small-local-bug | Full Palace - Route-only | Palace context output bytes | 4 | 1,870 | 1,870 | 0 [0, 0] |
| small-local-bug | Full Palace - Route-only | Palace context estimated tokens | 4 | 468 | 468 | 0 [0, 0] |
| small-local-bug | Full Palace - Route-only | Tool calls | 4 | 7 | 8 | 0.5 [-3, 3] |
| small-local-bug | Full Palace - Route-only | Wall time | 4 | 50.0s | 59.1s | 2.3s [-5.1s, 11.5s] |
| cross-stack-regression | Adaptive Palace - Control | Reported tokens | 3 | 90,731 | 77,676 | -12,902 [-27,995, 2,429] |
| cross-stack-regression | Adaptive Palace - Control | Uncached input tokens | 3 | 13,072 | 19,335 | 1,086 [-2,204, 10,410] |
| cross-stack-regression | Adaptive Palace - Control | Tool calls | 3 | 4 | 3 | -1 [-1, 0] |
| cross-stack-regression | Adaptive Palace - Control | Wall time | 3 | 38.7s | 44.9s | 6.2s [-6.1s, 10.7s] |
| cross-stack-regression | Adaptive Palace - Full Palace | Reported tokens | 3 | 128,454 | 77,676 | -50,778 [-52,091, -34,127] |
| cross-stack-regression | Adaptive Palace - Full Palace | Uncached input tokens | 3 | 11,439 | 19,335 | 2,317 [-2,350, 12,043] |
| cross-stack-regression | Adaptive Palace - Full Palace | Palace context output bytes | 3 | 3,121 | 4,617 | 1,496 [1,496, 1,496] |
| cross-stack-regression | Adaptive Palace - Full Palace | Palace context estimated tokens | 3 | 781 | 1,155 | 374 [374, 374] |
| cross-stack-regression | Adaptive Palace - Full Palace | Tool calls | 3 | 12 | 3 | -9 [-9, -3] |
| cross-stack-regression | Adaptive Palace - Full Palace | Wall time | 3 | 56.8s | 44.9s | -9.8s [-14.6s, -6.5s] |
| cross-stack-regression | Route-only - Control | Reported tokens | 3 | 90,731 | 125,821 | 35,243 [5,703, 51,229] |
| cross-stack-regression | Route-only - Control | Uncached input tokens | 3 | 13,072 | 15,875 | -1,466 [-3,394, 4,716] |
| cross-stack-regression | Route-only - Control | Tool calls | 3 | 4 | 11 | 7 [2, 9] |
| cross-stack-regression | Route-only - Control | Wall time | 3 | 38.7s | 55.3s | 14.8s [5.0s, 23.7s] |
| cross-stack-regression | Full Palace - Route-only | Reported tokens | 3 | 125,821 | 128,454 | 2,633 [-14,673, 18,393] |
| cross-stack-regression | Full Palace - Route-only | Uncached input tokens | 3 | 15,875 | 11,439 | 235 [-4,570, 1,761] |
| cross-stack-regression | Full Palace - Route-only | Palace context output bytes | 3 | 3,121 | 3,121 | 0 [0, 0] |
| cross-stack-regression | Full Palace - Route-only | Palace context estimated tokens | 3 | 781 | 781 | 0 [0, 0] |
| cross-stack-regression | Full Palace - Route-only | Tool calls | 3 | 11 | 12 | 0 [-5, 6] |
| cross-stack-regression | Full Palace - Route-only | Wall time | 3 | 55.3s | 56.8s | -2.0s [-3.3s, 3.4s] |

## Scope Outcomes Across Valid Primary Pairs

Scope is summarized for every valid Adaptive-Control pair, including runs that did not achieve protocol success.

| Scenario | Arm | Median changed-file precision | Median changed-file recall | Forbidden violations | Discordant success trial IDs |
| --- | --- | ---: | ---: | ---: | --- |
| small-local-bug | Control | 100.0% | 100.0% | 0 | none |
| small-local-bug | Adaptive Palace | 100.0% | 100.0% | 0 | none |
| cross-stack-regression | Control | 100.0% | 100.0% | 0 | none |
| cross-stack-regression | Adaptive Palace | 100.0% | 100.0% | 0 | none |

Efficiency metrics are calculated only for mutually successful pairs. Raw values and bootstrap intervals are available in the JSON report.

This exploratory pilot does not guarantee that Vertex Palace is faster on every task.
