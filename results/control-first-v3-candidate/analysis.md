# Vertex Palace Control-First Exploratory Analysis

Planned pilot trials: 16
Attempted trials: 4
Loaded reports: 4

Interim only: 4/16 planned trials are represented. Do not interpret these intervals or p-values as final evidence.

Primary comparison: Adaptive Palace versus Control
Primary efficiency metric: cumulative reported tokens

| Scenario | Primary comparison | Valid pairs | Baseline success | Treatment success | Treatment minus baseline (95% bootstrap CI) | Exact p | Holm p |
| --- | --- | ---: | ---: | ---: | --- | ---: | ---: |
| small-local-bug | Adaptive Palace - Control | 3 | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |

## Mutually Successful Pair Efficiency

Paired differences are primary treatment minus primary baseline. Negative values mean the treatment used less of the measured resource; wall time remains secondary.

| Scenario | Metric | Pairs | Baseline median | Treatment median | Paired median difference (95% bootstrap CI) |
| --- | --- | ---: | ---: | ---: | --- |
| small-local-bug | Reported tokens | 3 | 87,429 | 100,895 | 14,029 [12,919, 14,215] |
| small-local-bug | Uncached input tokens | 3 | 22,055 | 22,483 | 10,895 [-23,968, 14,058] |
| small-local-bug | Tool calls | 3 | 4 | 6 | 2 [1, 3] |
| small-local-bug | Wall time | 3 | 46.3s | 52.0s | 6.1s [-2.6s, 10.4s] |

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

## Scope Outcomes Across Valid Primary Pairs

Scope is summarized for every valid Adaptive-Control pair, including runs that did not achieve protocol success.

| Scenario | Arm | Median changed-file precision | Median changed-file recall | Forbidden violations | Discordant success trial IDs |
| --- | --- | ---: | ---: | ---: | --- |
| small-local-bug | Control | 100.0% | 100.0% | 0 | none |
| small-local-bug | Adaptive Palace | 100.0% | 100.0% | 0 | none |

Efficiency metrics are calculated only for mutually successful pairs. Raw values and bootstrap intervals are available in the JSON report.

This exploratory pilot does not guarantee that Vertex Palace is faster on every task.
