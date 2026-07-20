# Vertex Palace Control-First Exploratory Analysis

Planned pilot trials: 16
Attempted trials: 12
Loaded reports: 12

Interim only: 12/16 planned trials are represented. Do not interpret these intervals or p-values as final evidence.

Primary comparison: Adaptive Palace versus Control
Primary efficiency metric: cumulative reported tokens

| Scenario | Primary comparison | Valid pairs | Baseline success | Treatment success | Treatment minus baseline (95% bootstrap CI) | Exact p | Holm p |
| --- | --- | ---: | ---: | ---: | --- | ---: | ---: |
| small-local-bug | Adaptive Palace - Control | 4 | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |
| cross-stack-regression | Adaptive Palace - Control | 4 | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |
| decision-memory-dependent | Adaptive Palace - Control | 4 | 25.0% | 100.0% | 75.0% [25.0%, 100.0%] | 0.2500 | 0.7500 |

## Mutually Successful Pair Efficiency

Paired differences are primary treatment minus primary baseline. Negative values mean the treatment used less of the measured resource; wall time remains secondary.

| Scenario | Metric | Pairs | Baseline median | Treatment median | Paired median difference (95% bootstrap CI) |
| --- | --- | ---: | ---: | ---: | --- |
| small-local-bug | Reported tokens | 4 | 87,992.5 | 86,419.5 | -1,443.5 [-37,997, 38] |
| small-local-bug | Uncached input tokens | 4 | 12,048.5 | 15,025 | 1,678.5 [-4,276, 19,060] |
| small-local-bug | Tool calls | 4 | 4.5 | 5 | 0.5 [-2, 2] |
| small-local-bug | Wall time | 4 | 46.5s | 41.2s | -3.7s [-25.9s, 3.0s] |
| cross-stack-regression | Reported tokens | 4 | 91,082 | 77,315.5 | -13,822.5 [-27,995, 2,429] |
| cross-stack-regression | Uncached input tokens | 4 | 15,660.5 | 14,145 | -559 [-16,224, 10,410] |
| cross-stack-regression | Tool calls | 4 | 4 | 3 | -1 [-1, 0] |
| cross-stack-regression | Wall time | 4 | 44.5s | 44.5s | 0.1s [-10.0s, 10.7s] |
| decision-memory-dependent | Reported tokens | 1 | 228,534 | 131,235 | -97,299 [-97,299, -97,299] |
| decision-memory-dependent | Uncached input tokens | 1 | 33,189 | 12,425 | -20,764 [-20,764, -20,764] |
| decision-memory-dependent | Tool calls | 1 | 24 | 8 | -16 [-16, -16] |
| decision-memory-dependent | Wall time | 1 | 138.0s | 58.8s | -79.2s [-79.2s, -79.2s] |

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
| cross-stack-regression | Adaptive Palace - Control | Reported tokens | 4 | 91,082 | 77,315.5 | -13,822.5 [-27,995, 2,429] |
| cross-stack-regression | Adaptive Palace - Control | Uncached input tokens | 4 | 15,660.5 | 14,145 | -559 [-16,224, 10,410] |
| cross-stack-regression | Adaptive Palace - Control | Tool calls | 4 | 4 | 3 | -1 [-1, 0] |
| cross-stack-regression | Adaptive Palace - Control | Wall time | 4 | 44.5s | 44.5s | 0.1s [-10.0s, 10.7s] |
| cross-stack-regression | Adaptive Palace - Full Palace | Reported tokens | 4 | 128,750 | 77,315.5 | -51,434.5 [-71,011, -34,127] |
| cross-stack-regression | Adaptive Palace - Full Palace | Uncached input tokens | 4 | 13,255 | 14,145 | -16.5 [-6,877, 12,043] |
| cross-stack-regression | Adaptive Palace - Full Palace | Palace context output bytes | 4 | 3,121 | 4,617 | 1,496 [1,496, 1,496] |
| cross-stack-regression | Adaptive Palace - Full Palace | Palace context estimated tokens | 4 | 781 | 1,155 | 374 [374, 374] |
| cross-stack-regression | Adaptive Palace - Full Palace | Tool calls | 4 | 10 | 3 | -7 [-9, -3] |
| cross-stack-regression | Adaptive Palace - Full Palace | Wall time | 4 | 57.8s | 44.5s | -12.2s [-17.1s, -6.5s] |
| cross-stack-regression | Route-only - Control | Reported tokens | 4 | 91,082 | 127,731 | 36,725.5 [5,703, 51,229] |
| cross-stack-regression | Route-only - Control | Uncached input tokens | 4 | 15,660.5 | 15,518.5 | -2,430 [-9,256, 4,716] |
| cross-stack-regression | Route-only - Control | Tool calls | 4 | 4 | 12 | 8 [2, 10] |
| cross-stack-regression | Route-only - Control | Wall time | 4 | 44.5s | 55.9s | 9.9s [3.1s, 23.7s] |
| cross-stack-regression | Full Palace - Route-only | Reported tokens | 4 | 127,731 | 128,750 | 10,346.5 [-14,673, 18,393] |
| cross-stack-regression | Full Palace - Route-only | Uncached input tokens | 4 | 15,518.5 | 13,255 | 72 [-4,570, 1,761] |
| cross-stack-regression | Full Palace - Route-only | Palace context output bytes | 4 | 3,121 | 3,121 | 0 [0, 0] |
| cross-stack-regression | Full Palace - Route-only | Palace context estimated tokens | 4 | 781 | 781 | 0 [0, 0] |
| cross-stack-regression | Full Palace - Route-only | Tool calls | 4 | 12 | 10 | -2.5 [-6, 6] |
| cross-stack-regression | Full Palace - Route-only | Wall time | 4 | 55.9s | 57.8s | 0.7s [-3.3s, 4.1s] |
| decision-memory-dependent | Adaptive Palace - Control | Reported tokens | 1 | 228,534 | 131,235 | -97,299 [-97,299, -97,299] |
| decision-memory-dependent | Adaptive Palace - Control | Uncached input tokens | 1 | 33,189 | 12,425 | -20,764 [-20,764, -20,764] |
| decision-memory-dependent | Adaptive Palace - Control | Tool calls | 1 | 24 | 8 | -16 [-16, -16] |
| decision-memory-dependent | Adaptive Palace - Control | Wall time | 1 | 138.0s | 58.8s | -79.2s [-79.2s, -79.2s] |
| decision-memory-dependent | Adaptive Palace - Full Palace | Reported tokens | 4 | 193,020.5 | 123,698 | -68,981.5 [-122,055, -38,098] |
| decision-memory-dependent | Adaptive Palace - Full Palace | Uncached input tokens | 4 | 19,041.5 | 13,951 | -5,090.5 [-15,630, -1,029] |
| decision-memory-dependent | Adaptive Palace - Full Palace | Palace context output bytes | 4 | 4,571 | 6,890 | 2,319 [2,308, 2,334] |
| decision-memory-dependent | Adaptive Palace - Full Palace | Palace context estimated tokens | 4 | 1,143 | 1,723 | 580 [577, 583] |
| decision-memory-dependent | Adaptive Palace - Full Palace | Tool calls | 4 | 20.5 | 8.5 | -12.5 [-15, -11] |
| decision-memory-dependent | Adaptive Palace - Full Palace | Wall time | 4 | 99.8s | 62.3s | -31.0s [-49.8s, -17.5s] |
| decision-memory-dependent | Route-only - Control | Reported tokens | 1 | 228,534 | 208,780 | -19,754 [-19,754, -19,754] |
| decision-memory-dependent | Route-only - Control | Uncached input tokens | 1 | 33,189 | 23,893 | -9,296 [-9,296, -9,296] |
| decision-memory-dependent | Route-only - Control | Tool calls | 1 | 24 | 17 | -7 [-7, -7] |
| decision-memory-dependent | Route-only - Control | Wall time | 1 | 138.0s | 167.4s | 29.4s [29.4s, 29.4s] |
| decision-memory-dependent | Full Palace - Route-only | Reported tokens | 1 | 208,780 | 192,484 | -16,296 [-16,296, -16,296] |
| decision-memory-dependent | Full Palace - Route-only | Uncached input tokens | 1 | 23,893 | 17,850 | -6,043 [-6,043, -6,043] |
| decision-memory-dependent | Full Palace - Route-only | Palace context output bytes | 1 | 3,600 | 4,571 | 971 [971, 971] |
| decision-memory-dependent | Full Palace - Route-only | Palace context estimated tokens | 1 | 900 | 1,143 | 243 [243, 243] |
| decision-memory-dependent | Full Palace - Route-only | Tool calls | 1 | 17 | 21 | 4 [4, 4] |
| decision-memory-dependent | Full Palace - Route-only | Wall time | 1 | 167.4s | 108.6s | -58.8s [-58.8s, -58.8s] |

## Scope Outcomes Across Valid Primary Pairs

Scope is summarized for every valid Adaptive-Control pair, including runs that did not achieve protocol success.

| Scenario | Arm | Median changed-file precision | Median changed-file recall | Forbidden violations | Discordant success trial IDs |
| --- | --- | ---: | ---: | ---: | --- |
| small-local-bug | Control | 100.0% | 100.0% | 0 | none |
| small-local-bug | Adaptive Palace | 100.0% | 100.0% | 0 | none |
| cross-stack-regression | Control | 100.0% | 100.0% | 0 | none |
| cross-stack-regression | Adaptive Palace | 100.0% | 100.0% | 0 | none |
| decision-memory-dependent | Control | 0.0% | 0.0% | 3 | none |
| decision-memory-dependent | Adaptive Palace | 100.0% | 100.0% | 0 | `decision-memory-dependent-control-first-v3-pilot-01`, `decision-memory-dependent-control-first-v3-pilot-02`, `decision-memory-dependent-control-first-v3-pilot-03` |

Efficiency metrics are calculated only for mutually successful pairs. Raw values and bootstrap intervals are available in the JSON report.

This exploratory pilot does not guarantee that Vertex Palace is faster on every task.
