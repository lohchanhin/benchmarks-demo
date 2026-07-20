# Vertex Palace Control-First Exploratory Analysis

Planned pilot trials: 16
Attempted trials: 6
Loaded reports: 6

Interim only: 6/16 planned trials are represented. Do not interpret these intervals or p-values as final evidence.

Primary comparison: Adaptive Palace versus Control
Primary efficiency metric: cumulative reported tokens

| Scenario | Primary comparison | Valid pairs | Baseline success | Treatment success | Treatment minus baseline (95% bootstrap CI) | Exact p | Holm p |
| --- | --- | ---: | ---: | ---: | --- | ---: | ---: |
| small-local-bug | Adaptive Palace - Control | 4 | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |
| cross-stack-regression | Adaptive Palace - Control | 2 | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |

## Mutually Successful Pair Efficiency

Paired differences are primary treatment minus primary baseline. Negative values mean the treatment used less of the measured resource; wall time remains secondary.

| Scenario | Metric | Pairs | Baseline median | Treatment median | Paired median difference (95% bootstrap CI) |
| --- | --- | ---: | ---: | ---: | --- |
| small-local-bug | Reported tokens | 4 | 87,992.5 | 86,419.5 | -1,443.5 [-37,997, 38] |
| small-local-bug | Uncached input tokens | 4 | 12,048.5 | 15,025 | 1,678.5 [-4,276, 19,060] |
| small-local-bug | Tool calls | 4 | 4.5 | 5 | 0.5 [-2, 2] |
| small-local-bug | Wall time | 4 | 46.5s | 41.2s | -3.7s [-25.9s, 3.0s] |
| cross-stack-regression | Reported tokens | 2 | 97,764 | 77,315.5 | -20,448.5 [-27,995, -12,902] |
| cross-stack-regression | Uncached input tokens | 2 | 12,115.5 | 16,218.5 | 4,103 [-2,204, 10,410] |
| cross-stack-regression | Tool calls | 2 | 4 | 3 | -1 [-1, -1] |
| cross-stack-regression | Wall time | 2 | 44.5s | 44.5s | 0.1s [-6.1s, 6.2s] |

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
| cross-stack-regression | Adaptive Palace - Control | Reported tokens | 2 | 97,764 | 77,315.5 | -20,448.5 [-27,995, -12,902] |
| cross-stack-regression | Adaptive Palace - Control | Uncached input tokens | 2 | 12,115.5 | 16,218.5 | 4,103 [-2,204, 10,410] |
| cross-stack-regression | Adaptive Palace - Control | Tool calls | 2 | 4 | 3 | -1 [-1, -1] |
| cross-stack-regression | Adaptive Palace - Control | Wall time | 2 | 44.5s | 44.5s | 0.1s [-6.1s, 6.2s] |
| cross-stack-regression | Adaptive Palace - Full Palace | Reported tokens | 2 | 128,750 | 77,315.5 | -51,434.5 [-52,091, -50,778] |
| cross-stack-regression | Adaptive Palace - Full Palace | Uncached input tokens | 2 | 11,372 | 16,218.5 | 4,846.5 [-2,350, 12,043] |
| cross-stack-regression | Adaptive Palace - Full Palace | Palace context output bytes | 2 | 3,121 | 4,617 | 1,496 [1,496, 1,496] |
| cross-stack-regression | Adaptive Palace - Full Palace | Palace context estimated tokens | 2 | 781 | 1,155 | 374 [374, 374] |
| cross-stack-regression | Adaptive Palace - Full Palace | Tool calls | 2 | 9 | 3 | -6 [-9, -3] |
| cross-stack-regression | Adaptive Palace - Full Palace | Wall time | 2 | 55.1s | 44.5s | -10.6s [-14.6s, -6.5s] |
| cross-stack-regression | Route-only - Control | Reported tokens | 2 | 97,764 | 118,237 | 20,473 [5,703, 35,243] |
| cross-stack-regression | Route-only - Control | Uncached input tokens | 2 | 12,115.5 | 12,776.5 | 661 [-3,394, 4,716] |
| cross-stack-regression | Route-only - Control | Tool calls | 2 | 4 | 8.5 | 4.5 [2, 7] |
| cross-stack-regression | Route-only - Control | Wall time | 2 | 44.5s | 54.4s | 9.9s [5.0s, 14.8s] |
| cross-stack-regression | Full Palace - Route-only | Reported tokens | 2 | 118,237 | 128,750 | 10,513 [2,633, 18,393] |
| cross-stack-regression | Full Palace - Route-only | Uncached input tokens | 2 | 12,776.5 | 11,372 | -1,404.5 [-4,570, 1,761] |
| cross-stack-regression | Full Palace - Route-only | Palace context output bytes | 2 | 3,121 | 3,121 | 0 [0, 0] |
| cross-stack-regression | Full Palace - Route-only | Palace context estimated tokens | 2 | 781 | 781 | 0 [0, 0] |
| cross-stack-regression | Full Palace - Route-only | Tool calls | 2 | 8.5 | 9 | 0.5 [-5, 6] |
| cross-stack-regression | Full Palace - Route-only | Wall time | 2 | 54.4s | 55.1s | 0.7s [-2.0s, 3.4s] |

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
