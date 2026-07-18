# Vertex Palace Exploratory Pilot Analysis

Planned pilot trials: 20
Attempted trials: 19
Loaded reports: 19

Interim only: 19/20 planned trials are represented. Do not interpret these intervals or p-values as final evidence.

| Scenario | Valid pairs | Control success | Full Palace success | Paired difference (95% bootstrap CI) | Exact p | Holm p |
| --- | ---: | ---: | ---: | --- | ---: | ---: |
| small-local-bug | 5 | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |
| cross-stack-regression | 5 | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |
| tenant-memory-pitfall | 5 | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |
| stale-memory-adversarial | 4 | 100.0% | 100.0% | 0.0% [0.0%, 0.0%] | 1.0000 | 1.0000 |

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
| stale-memory-adversarial | Reported tokens | 4 | 262,153.5 | 361,563 | 91,450.5 [63,732, 179,047] |
| stale-memory-adversarial | Uncached input tokens | 4 | 20,424 | 34,262.5 | 9,328 [1,310, 17,988] |
| stale-memory-adversarial | Tool calls | 4 | 12 | 18 | 6.5 [3, 19] |
| stale-memory-adversarial | Wall time | 4 | 111.7s | 153.8s | 36.9s [20.2s, 49.9s] |

Efficiency metrics are calculated only for mutually successful pairs. Raw values and bootstrap intervals are available in the JSON report.

This exploratory pilot does not guarantee that Vertex Palace is faster on every task.
