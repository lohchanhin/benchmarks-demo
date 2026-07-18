# Vertex Palace Exploratory Pilot Analysis

Planned pilot trials: 20
Attempted trials: 20
Loaded reports: 20

| Scenario | Valid pairs | Control success | Route-only success | Full Palace success | Full minus Control (95% bootstrap CI) | Exact p | Holm p |
| --- | ---: | ---: | ---: | ---: | --- | ---: | ---: |
| small-local-bug | 5 | 100.0% | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |
| cross-stack-regression | 5 | 100.0% | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |
| tenant-memory-pitfall | 5 | 100.0% | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |
| stale-memory-adversarial | 5 | 100.0% | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |

## Mutually Successful Pair Efficiency

Paired differences are Full Palace minus Control. Negative values mean Full Palace used less of the measured resource; wall time remains secondary.

| Scenario | Metric | Pairs | Control median | Full median | Paired median difference (95% bootstrap CI) |
| --- | --- | ---: | ---: | ---: | --- |
| small-local-bug | Reported tokens | 5 | 312,034 | 339,111 | 29,423 [-2,445, 113,838] |
| small-local-bug | Uncached input tokens | 5 | 31,934 | 33,287 | -130 [-24,212, 11,814] |
| small-local-bug | Tool calls | 5 | 14 | 20 | 6 [3, 7] |
| small-local-bug | Wall time | 5 | 147.7s | 169.7s | -16.8s [-25.5s, 62.0s] |
| cross-stack-regression | Reported tokens | 5 | 245,300 | 240,938 | 23,648 [-43,041, 85,854] |
| cross-stack-regression | Uncached input tokens | 5 | 23,420 | 28,543 | 10,250 [-5,575, 21,513] |
| cross-stack-regression | Tool calls | 5 | 11 | 24 | 11 [7, 17] |
| cross-stack-regression | Wall time | 5 | 97.3s | 113.0s | 20.5s [-7.5s, 37.5s] |
| tenant-memory-pitfall | Reported tokens | 5 | 371,411 | 528,164 | 173,308 [-64,710, 225,172] |
| tenant-memory-pitfall | Uncached input tokens | 5 | 27,105 | 32,152 | 5,279 [-15,277, 11,023] |
| tenant-memory-pitfall | Tool calls | 5 | 14 | 35 | 20 [-1, 24] |
| tenant-memory-pitfall | Wall time | 5 | 149.7s | 203.7s | 68.5s [-34.7s, 84.4s] |
| stale-memory-adversarial | Reported tokens | 5 | 264,853 | 354,140 | 71,864 [5,069, 179,047] |
| stale-memory-adversarial | Uncached input tokens | 5 | 20,598 | 36,239 | 6,620 [1,310, 17,988] |
| stale-memory-adversarial | Tool calls | 5 | 12 | 21 | 9 [3, 19] |
| stale-memory-adversarial | Wall time | 5 | 115.4s | 153.5s | 35.0s [20.2s, 49.9s] |

## Three-Arm Ablation

Each contrast is treatment minus baseline. Negative efficiency values favor the treatment. These secondary mechanism contrasts are exploratory and are not multiplicity-adjusted.

| Scenario | Contrast | Metric | Pairs | Baseline median | Treatment median | Paired median difference (95% bootstrap CI) |
| --- | --- | --- | ---: | ---: | ---: | --- |
| small-local-bug | Route-only - Control | Reported tokens | 5 | 312,034 | 303,755 | 8,530 [-24,595, 352,834] |
| small-local-bug | Route-only - Control | Uncached input tokens | 5 | 31,934 | 32,673 | 2,221 [-16,514, 22,496] |
| small-local-bug | Route-only - Control | Tool calls | 5 | 14 | 21 | 6 [-3, 21] |
| small-local-bug | Route-only - Control | Wall time | 5 | 147.7s | 171.2s | 23.4s [-40.0s, 246.9s] |
| small-local-bug | Full Palace - Route-only | Reported tokens | 5 | 303,755 | 339,111 | 6,832 [-323,411, 105,308] |
| small-local-bug | Full Palace - Route-only | Uncached input tokens | 5 | 32,673 | 33,287 | 9,562 [-46,708, 16,384] |
| small-local-bug | Full Palace - Route-only | Tool calls | 5 | 21 | 20 | 0 [-14, 7] |
| small-local-bug | Full Palace - Route-only | Wall time | 5 | 171.2s | 169.7s | 8.0s [-269.7s, 49.8s] |
| cross-stack-regression | Route-only - Control | Reported tokens | 5 | 245,300 | 280,097 | 39,776 [-11,175, 125,013] |
| cross-stack-regression | Route-only - Control | Uncached input tokens | 5 | 23,420 | 27,958 | -1,346 [-4,860, 29,842] |
| cross-stack-regression | Route-only - Control | Tool calls | 5 | 11 | 21 | 11 [-4, 14] |
| cross-stack-regression | Route-only - Control | Wall time | 5 | 97.3s | 114.7s | 23.5s [-9.5s, 46.2s] |
| cross-stack-regression | Full Palace - Route-only | Reported tokens | 5 | 280,097 | 240,938 | -39,159 [-104,430, 58,792] |
| cross-stack-regression | Full Palace - Route-only | Uncached input tokens | 5 | 27,958 | 28,543 | -4,229 [-24,258, 26,373] |
| cross-stack-regression | Full Palace - Route-only | Tool calls | 5 | 21 | 24 | 3 [-7, 15] |
| cross-stack-regression | Full Palace - Route-only | Wall time | 5 | 114.7s | 113.0s | -1.7s [-31.1s, 23.9s] |
| tenant-memory-pitfall | Route-only - Control | Reported tokens | 5 | 371,411 | 394,202 | 17,901 [-50,742, 155,947] |
| tenant-memory-pitfall | Route-only - Control | Uncached input tokens | 5 | 27,105 | 28,055 | 3,375 [-6,210, 12,854] |
| tenant-memory-pitfall | Route-only - Control | Tool calls | 5 | 14 | 29 | 17 [0, 19] |
| tenant-memory-pitfall | Route-only - Control | Wall time | 5 | 149.7s | 148.1s | -1.6s [-30.2s, 52.4s] |
| tenant-memory-pitfall | Full Palace - Route-only | Reported tokens | 5 | 394,202 | 528,164 | 133,962 [-16,205, 275,914] |
| tenant-memory-pitfall | Full Palace - Route-only | Uncached input tokens | 5 | 28,055 | 32,152 | 7,648 [-28,131, 11,489] |
| tenant-memory-pitfall | Full Palace - Route-only | Tool calls | 5 | 29 | 35 | 1 [-1, 20] |
| tenant-memory-pitfall | Full Palace - Route-only | Wall time | 5 | 148.1s | 203.7s | 41.4s [-19.6s, 114.6s] |
| stale-memory-adversarial | Route-only - Control | Reported tokens | 5 | 264,853 | 289,838 | 24,985 [-29,405, 113,232] |
| stale-memory-adversarial | Route-only - Control | Uncached input tokens | 5 | 20,598 | 34,034 | 13,784 [-25,950, 28,987] |
| stale-memory-adversarial | Route-only - Control | Tool calls | 5 | 12 | 23 | 11 [4, 19] |
| stale-memory-adversarial | Route-only - Control | Wall time | 5 | 115.4s | 125.0s | 9.6s [-9.1s, 49.3s] |
| stale-memory-adversarial | Full Palace - Route-only | Reported tokens | 5 | 289,838 | 354,140 | 42,914 [34,474, 66,688] |
| stale-memory-adversarial | Full Palace - Route-only | Uncached input tokens | 5 | 34,034 | 36,239 | -1,748 [-27,677, 31,585] |
| stale-memory-adversarial | Full Palace - Route-only | Tool calls | 5 | 23 | 21 | -3 [-16, 15] |
| stale-memory-adversarial | Full Palace - Route-only | Wall time | 5 | 125.0s | 153.5s | 28.6s [-29.1s, 30.6s] |

Efficiency metrics are calculated only for mutually successful pairs. Raw values and bootstrap intervals are available in the JSON report.

This exploratory pilot does not guarantee that Vertex Palace is faster on every task.
