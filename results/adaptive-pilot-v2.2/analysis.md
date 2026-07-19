# Vertex Palace Exploratory Pilot Analysis

Planned pilot trials: 16
Attempted trials: 9
Loaded reports: 9

Interim only: 9/16 planned trials are represented. Do not interpret these intervals or p-values as final evidence.

| Scenario | Primary comparison | Valid pairs | Baseline success | Treatment success | Treatment minus baseline (95% bootstrap CI) | Exact p | Holm p |
| --- | --- | ---: | ---: | ---: | --- | ---: | ---: |
| small-local-bug | Adaptive Palace - Full Palace | 4 | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |
| cross-stack-regression | Adaptive Palace - Full Palace | 4 | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |
| tenant-memory-pitfall | Adaptive Palace - Full Palace | 1 | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |

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
| cross-stack-regression | Reported tokens | 4 | 115,672.5 | 152,191.5 | 25,709.5 [-55,146, 111,003] |
| cross-stack-regression | Uncached input tokens | 4 | 18,940 | 18,791.5 | -2,083 [-14,511, 5,338] |
| cross-stack-regression | Palace context output bytes | 4 | 3,108 | 2,179 | -929 [-929, -929] |
| cross-stack-regression | Palace context estimated tokens | 4 | 777 | 545 | -232 [-232, -232] |
| cross-stack-regression | Tool calls | 4 | 14 | 11.5 | -2 [-8, 4] |
| cross-stack-regression | Wall time | 4 | 91.8s | 75.3s | -16.5s [-55.1s, 17.9s] |
| tenant-memory-pitfall | Reported tokens | 1 | 178,229 | 162,239 | -15,990 [-15,990, -15,990] |
| tenant-memory-pitfall | Uncached input tokens | 1 | 22,084 | 12,920 | -9,164 [-9,164, -9,164] |
| tenant-memory-pitfall | Palace context output bytes | 1 | 5,465 | 2,450 | -3,015 [-3,015, -3,015] |
| tenant-memory-pitfall | Palace context estimated tokens | 1 | 1,367 | 613 | -754 [-754, -754] |
| tenant-memory-pitfall | Tool calls | 1 | 12 | 8 | -4 [-4, -4] |
| tenant-memory-pitfall | Wall time | 1 | 96.7s | 90.7s | -6.0s [-6.0s, -6.0s] |

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
| cross-stack-regression | Route-only - Control | Reported tokens | 4 | 105,556 | 148,510.5 | 28,403 [3,341, 53,833] |
| cross-stack-regression | Route-only - Control | Uncached input tokens | 4 | 14,285.5 | 19,193 | 6,705 [-15,006, 19,304] |
| cross-stack-regression | Route-only - Control | Tool calls | 4 | 5.5 | 12.5 | 6.5 [0, 10] |
| cross-stack-regression | Route-only - Control | Wall time | 4 | 50.7s | 66.4s | 12.4s [-3.2s, 18.4s] |
| cross-stack-regression | Full Palace - Route-only | Reported tokens | 4 | 148,510.5 | 115,672.5 | -19,200.5 [-57,845, 73,419] |
| cross-stack-regression | Full Palace - Route-only | Uncached input tokens | 4 | 19,193 | 18,940 | 2,024.5 [-6,328, 5,954] |
| cross-stack-regression | Full Palace - Route-only | Palace context output bytes | 4 | 3,108 | 3,108 | 0 [0, 0] |
| cross-stack-regression | Full Palace - Route-only | Palace context estimated tokens | 4 | 777 | 777 | 0 [0, 0] |
| cross-stack-regression | Full Palace - Route-only | Tool calls | 4 | 12.5 | 14 | 5 [-11, 7] |
| cross-stack-regression | Full Palace - Route-only | Wall time | 4 | 66.4s | 91.8s | 28.6s [5.2s, 50.2s] |
| cross-stack-regression | Adaptive Palace - Control | Reported tokens | 4 | 105,556 | 152,191.5 | 51,917 [-20,550, 115,145] |
| cross-stack-regression | Adaptive Palace - Control | Uncached input tokens | 4 | 14,285.5 | 18,791.5 | 1,069 [-3,714, 9,620] |
| cross-stack-regression | Adaptive Palace - Control | Tool calls | 4 | 5.5 | 11.5 | 5.5 [1, 9] |
| cross-stack-regression | Adaptive Palace - Control | Wall time | 4 | 50.7s | 75.3s | 20.2s [4.2s, 37.7s] |
| cross-stack-regression | Adaptive Palace - Full Palace | Reported tokens | 4 | 115,672.5 | 152,191.5 | 25,709.5 [-55,146, 111,003] |
| cross-stack-regression | Adaptive Palace - Full Palace | Uncached input tokens | 4 | 18,940 | 18,791.5 | -2,083 [-14,511, 5,338] |
| cross-stack-regression | Adaptive Palace - Full Palace | Palace context output bytes | 4 | 3,108 | 2,179 | -929 [-929, -929] |
| cross-stack-regression | Adaptive Palace - Full Palace | Palace context estimated tokens | 4 | 777 | 545 | -232 [-232, -232] |
| cross-stack-regression | Adaptive Palace - Full Palace | Tool calls | 4 | 14 | 11.5 | -2 [-8, 4] |
| cross-stack-regression | Adaptive Palace - Full Palace | Wall time | 4 | 91.8s | 75.3s | -16.5s [-55.1s, 17.9s] |
| tenant-memory-pitfall | Route-only - Control | Reported tokens | 1 | 128,622 | 160,463 | 31,841 [31,841, 31,841] |
| tenant-memory-pitfall | Route-only - Control | Uncached input tokens | 1 | 24,682 | 15,522 | -9,160 [-9,160, -9,160] |
| tenant-memory-pitfall | Route-only - Control | Tool calls | 1 | 5 | 24 | 19 [19, 19] |
| tenant-memory-pitfall | Route-only - Control | Wall time | 1 | 75.4s | 97.0s | 21.5s [21.5s, 21.5s] |
| tenant-memory-pitfall | Full Palace - Route-only | Reported tokens | 1 | 160,463 | 178,229 | 17,766 [17,766, 17,766] |
| tenant-memory-pitfall | Full Palace - Route-only | Uncached input tokens | 1 | 15,522 | 22,084 | 6,562 [6,562, 6,562] |
| tenant-memory-pitfall | Full Palace - Route-only | Palace context output bytes | 1 | 4,545 | 5,465 | 920 [920, 920] |
| tenant-memory-pitfall | Full Palace - Route-only | Palace context estimated tokens | 1 | 1,137 | 1,367 | 230 [230, 230] |
| tenant-memory-pitfall | Full Palace - Route-only | Tool calls | 1 | 24 | 12 | -12 [-12, -12] |
| tenant-memory-pitfall | Full Palace - Route-only | Wall time | 1 | 97.0s | 96.7s | -0.3s [-0.3s, -0.3s] |
| tenant-memory-pitfall | Adaptive Palace - Control | Reported tokens | 1 | 128,622 | 162,239 | 33,617 [33,617, 33,617] |
| tenant-memory-pitfall | Adaptive Palace - Control | Uncached input tokens | 1 | 24,682 | 12,920 | -11,762 [-11,762, -11,762] |
| tenant-memory-pitfall | Adaptive Palace - Control | Tool calls | 1 | 5 | 8 | 3 [3, 3] |
| tenant-memory-pitfall | Adaptive Palace - Control | Wall time | 1 | 75.4s | 90.7s | 15.2s [15.2s, 15.2s] |
| tenant-memory-pitfall | Adaptive Palace - Full Palace | Reported tokens | 1 | 178,229 | 162,239 | -15,990 [-15,990, -15,990] |
| tenant-memory-pitfall | Adaptive Palace - Full Palace | Uncached input tokens | 1 | 22,084 | 12,920 | -9,164 [-9,164, -9,164] |
| tenant-memory-pitfall | Adaptive Palace - Full Palace | Palace context output bytes | 1 | 5,465 | 2,450 | -3,015 [-3,015, -3,015] |
| tenant-memory-pitfall | Adaptive Palace - Full Palace | Palace context estimated tokens | 1 | 1,367 | 613 | -754 [-754, -754] |
| tenant-memory-pitfall | Adaptive Palace - Full Palace | Tool calls | 1 | 12 | 8 | -4 [-4, -4] |
| tenant-memory-pitfall | Adaptive Palace - Full Palace | Wall time | 1 | 96.7s | 90.7s | -6.0s [-6.0s, -6.0s] |

Efficiency metrics are calculated only for mutually successful pairs. Raw values and bootstrap intervals are available in the JSON report.

This exploratory pilot does not guarantee that Vertex Palace is faster on every task.
