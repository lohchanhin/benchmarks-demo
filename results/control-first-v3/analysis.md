# Vertex Palace Control-First Exploratory Analysis

Planned pilot trials: 16
Attempted trials: 2
Loaded reports: 2

Interim only: 2/16 planned trials are represented. Do not interpret these intervals or p-values as final evidence.

Primary comparison: Adaptive Palace versus Control
Primary efficiency metric: cumulative reported tokens

| Scenario | Primary comparison | Valid pairs | Baseline success | Treatment success | Treatment minus baseline (95% bootstrap CI) | Exact p | Holm p |
| --- | --- | ---: | ---: | ---: | --- | ---: | ---: |
| small-local-bug | Adaptive Palace - Control | 2 | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |

## Mutually Successful Pair Efficiency

Paired differences are primary treatment minus primary baseline. Negative values mean the treatment used less of the measured resource; wall time remains secondary.

| Scenario | Metric | Pairs | Baseline median | Treatment median | Paired median difference (95% bootstrap CI) |
| --- | --- | ---: | ---: | ---: | --- |
| small-local-bug | Reported tokens | 2 | 87,992.5 | 86,549 | -1,443.5 [-2,081, -806] |
| small-local-bug | Uncached input tokens | 2 | 10,580 | 10,127 | -453 [-4,276, 3,370] |
| small-local-bug | Tool calls | 2 | 4.5 | 6 | 1.5 [1, 2] |
| small-local-bug | Wall time | 2 | 46.4s | 42.7s | -3.7s [-4.8s, -2.5s] |

## Four-Arm Control-First Contrasts

Each contrast is treatment minus baseline. Negative efficiency values favor the treatment. These secondary mechanism contrasts are exploratory and are not multiplicity-adjusted.

| Scenario | Contrast | Metric | Pairs | Baseline median | Treatment median | Paired median difference (95% bootstrap CI) |
| --- | --- | --- | ---: | ---: | ---: | --- |
| small-local-bug | Adaptive Palace - Control | Reported tokens | 2 | 87,992.5 | 86,549 | -1,443.5 [-2,081, -806] |
| small-local-bug | Adaptive Palace - Control | Uncached input tokens | 2 | 10,580 | 10,127 | -453 [-4,276, 3,370] |
| small-local-bug | Adaptive Palace - Control | Tool calls | 2 | 4.5 | 6 | 1.5 [1, 2] |
| small-local-bug | Adaptive Palace - Control | Wall time | 2 | 46.4s | 42.7s | -3.7s [-4.8s, -2.5s] |
| small-local-bug | Adaptive Palace - Full Palace | Reported tokens | 2 | 113,820.5 | 86,549 | -27,271.5 [-36,568, -17,975] |
| small-local-bug | Adaptive Palace - Full Palace | Uncached input tokens | 2 | 18,356 | 10,127 | -8,229 [-14,614, -1,844] |
| small-local-bug | Adaptive Palace - Full Palace | Palace context output bytes | 2 | 1,870 | 259 | -1,611 [-1,611, -1,611] |
| small-local-bug | Adaptive Palace - Full Palace | Palace context estimated tokens | 2 | 468 | 65 | -403 [-403, -403] |
| small-local-bug | Adaptive Palace - Full Palace | Tool calls | 2 | 6.5 | 6 | -0.5 [-2, 1] |
| small-local-bug | Adaptive Palace - Full Palace | Wall time | 2 | 52.7s | 42.7s | -10.0s [-14.3s, -5.6s] |
| small-local-bug | Route-only - Control | Reported tokens | 2 | 87,992.5 | 105,097.5 | 17,105 [16,909, 17,301] |
| small-local-bug | Route-only - Control | Uncached input tokens | 2 | 10,580 | 13,981 | 3,401 [1,246, 5,556] |
| small-local-bug | Route-only - Control | Tool calls | 2 | 4.5 | 6.5 | 2 [1, 3] |
| small-local-bug | Route-only - Control | Wall time | 2 | 46.4s | 49.5s | 3.1s [-1.9s, 8.2s] |
| small-local-bug | Full Palace - Route-only | Reported tokens | 2 | 105,097.5 | 113,820.5 | 8,723 [-1,015, 18,461] |
| small-local-bug | Full Palace - Route-only | Uncached input tokens | 2 | 13,981 | 18,356 | 4,375 [-7,988, 16,738] |
| small-local-bug | Full Palace - Route-only | Palace context output bytes | 2 | 1,870 | 1,870 | 0 [0, 0] |
| small-local-bug | Full Palace - Route-only | Palace context estimated tokens | 2 | 468 | 468 | 0 [0, 0] |
| small-local-bug | Full Palace - Route-only | Tool calls | 2 | 6.5 | 6.5 | 0 [-3, 3] |
| small-local-bug | Full Palace - Route-only | Wall time | 2 | 49.5s | 52.7s | 3.2s [-5.1s, 11.5s] |

## Scope Outcomes Across Valid Primary Pairs

Scope is summarized for every valid Adaptive-Control pair, including runs that did not achieve protocol success.

| Scenario | Arm | Median changed-file precision | Median changed-file recall | Forbidden violations | Discordant success trial IDs |
| --- | --- | ---: | ---: | ---: | --- |
| small-local-bug | Control | 100.0% | 100.0% | 0 | none |
| small-local-bug | Adaptive Palace | 100.0% | 100.0% | 0 | none |

Efficiency metrics are calculated only for mutually successful pairs. Raw values and bootstrap intervals are available in the JSON report.

This exploratory pilot does not guarantee that Vertex Palace is faster on every task.
