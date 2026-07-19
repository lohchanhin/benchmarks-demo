# Vertex Palace Exploratory Pilot Analysis

Planned pilot trials: 16
Attempted trials: 7
Loaded reports: 7

Interim only: 7/16 planned trials are represented. Do not interpret these intervals or p-values as final evidence.

| Scenario | Primary comparison | Valid pairs | Baseline success | Treatment success | Treatment minus baseline (95% bootstrap CI) | Exact p | Holm p |
| --- | --- | ---: | ---: | ---: | --- | ---: | ---: |
| small-local-bug | Adaptive Palace - Full Palace | 4 | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |
| cross-stack-regression | Adaptive Palace - Full Palace | 3 | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |

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
| cross-stack-regression | Reported tokens | 3 | 115,399 | 142,777 | 26,831 [24,588, 111,003] |
| cross-stack-regression | Uncached input tokens | 3 | 20,423 | 17,996 | -7,710 [-14,511, 5,338] |
| cross-stack-regression | Palace context output bytes | 3 | 3,108 | 2,179 | -929 [-929, -929] |
| cross-stack-regression | Palace context estimated tokens | 3 | 777 | 545 | -232 [-232, -232] |
| cross-stack-regression | Tool calls | 3 | 10 | 10 | 2 [-8, 4] |
| cross-stack-regression | Wall time | 3 | 81.7s | 70.3s | -11.4s [-55.1s, 17.9s] |

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
| cross-stack-regression | Route-only - Control | Reported tokens | 3 | 111,257 | 153,688 | 10,464 [3,341, 53,833] |
| cross-stack-regression | Route-only - Control | Uncached input tokens | 3 | 15,009 | 26,751 | 11,742 [-15,006, 19,304] |
| cross-stack-regression | Route-only - Control | Tool calls | 3 | 5 | 11 | 6 [0, 10] |
| cross-stack-regression | Route-only - Control | Wall time | 3 | 50.7s | 65.0s | 10.5s [-3.2s, 14.3s] |
| cross-stack-regression | Full Palace - Route-only | Reported tokens | 3 | 153,688 | 115,399 | -39,202 [-57,845, 801] |
| cross-stack-regression | Full Palace - Route-only | Uncached input tokens | 3 | 26,751 | 20,423 | -359 [-6,328, 5,954] |
| cross-stack-regression | Full Palace - Route-only | Palace context output bytes | 3 | 3,108 | 3,108 | 0 [0, 0] |
| cross-stack-regression | Full Palace - Route-only | Palace context estimated tokens | 3 | 777 | 777 | 0 [0, 0] |
| cross-stack-regression | Full Palace - Route-only | Tool calls | 3 | 11 | 10 | 5 [-11, 7] |
| cross-stack-regression | Full Palace - Route-only | Wall time | 3 | 65.0s | 81.7s | 23.1s [5.2s, 50.2s] |
| cross-stack-regression | Adaptive Palace - Control | Reported tokens | 3 | 111,257 | 142,777 | 39,219 [-20,550, 115,145] |
| cross-stack-regression | Adaptive Palace - Control | Uncached input tokens | 3 | 15,009 | 17,996 | -2,296 [-3,714, 4,434] |
| cross-stack-regression | Adaptive Palace - Control | Tool calls | 3 | 5 | 10 | 5 [1, 9] |
| cross-stack-regression | Adaptive Palace - Control | Wall time | 3 | 50.7s | 70.3s | 9.4s [4.2s, 37.7s] |
| cross-stack-regression | Adaptive Palace - Full Palace | Reported tokens | 3 | 115,399 | 142,777 | 26,831 [24,588, 111,003] |
| cross-stack-regression | Adaptive Palace - Full Palace | Uncached input tokens | 3 | 20,423 | 17,996 | -7,710 [-14,511, 5,338] |
| cross-stack-regression | Adaptive Palace - Full Palace | Palace context output bytes | 3 | 3,108 | 2,179 | -929 [-929, -929] |
| cross-stack-regression | Adaptive Palace - Full Palace | Palace context estimated tokens | 3 | 777 | 545 | -232 [-232, -232] |
| cross-stack-regression | Adaptive Palace - Full Palace | Tool calls | 3 | 10 | 10 | 2 [-8, 4] |
| cross-stack-regression | Adaptive Palace - Full Palace | Wall time | 3 | 81.7s | 70.3s | -11.4s [-55.1s, 17.9s] |

Efficiency metrics are calculated only for mutually successful pairs. Raw values and bootstrap intervals are available in the JSON report.

This exploratory pilot does not guarantee that Vertex Palace is faster on every task.
