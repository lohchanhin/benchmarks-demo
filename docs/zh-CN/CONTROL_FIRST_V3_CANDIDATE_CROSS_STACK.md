# 候选验证：Cross-Stack 区块

状态：**cross-stack 完成 4/4 trial；16/16 Arm 全部有效且成功**。

完成本区块后，候选研究总进度为 8/16 trial、32 个 Arm、31 个有效、30 个成功。少掉的
有效与成功数量只来自先前已公开的 small-local 基础设施事故。

## 完整性与基础设施

- 所有预注册 ID、seed、cache state 与 Williams 顺序都照计划执行。
- 防休眠守卫在整个区块保持 active，结束后以 exit code 0、空 stderr 正常释放。
- 目前 64 个公开证据文件全部通过 checksum 与隐私审计。
- 所有 Arm 都是顺序执行，没有同时进行。

## 正确性、修改范围与路由

Control、Route-only、Full、Adaptive 全部通过公开测试与隐藏 Oracle。每个 Arm 都只修改
要求的两个文件，changed-file precision 与 recall 均为 `1.0 / 1.0`，没有 forbidden change。

12 个 Palace Arm 全部找齐四个路由 ground-truth 文件：Route Recall@K 都是 `1.0`，
Precision@K 都是 `0.8`。这支持 0.3.0 的路由修正在合成 cross-stack contract 上准确完整。
但 Control 四次也都精确完成，所以没有观察到正确性优势。

## Adaptive 行为

Adaptive 四次都选择 `full-palace`。每次输出 4,183 context bytes，而传统 Full 与 Route-only
都是 3,121 bytes。保守模式没有漏掉跨层依赖，但也没有把 payload 限制到 Full Palace 以下。

## 配对结果

| 比较 | Reported Token 配对中位差 | 工具调用配对中位差 | 墙钟时间配对中位差 |
| --- | ---: | ---: | ---: |
| Adaptive - Control | +30,630.5（95% bootstrap CI +11,218 到 +53,592） | +3（CI +2 到 +6） | +10.974 秒（CI +9.022 到 +22.131） |
| Adaptive - Full | +1,283.5（CI -19,868 到 +19,881） | -4（CI -6 到 +1） | -2.483 秒（CI -32.704 到 +15.075） |
| Route-only - Control | +20,260.5（CI -5,355 到 +37,438） | +8（CI +8 到 +10） | +8.805 秒（CI +4.725 到 +16.899） |

四组配对仍属于探索性样本，但产品诊断方向已经很清楚：本区块的 Adaptive 与 Full 差异
区间很宽，同时相较 Control 明显消耗更多。

## 阶段决定

0.3.0 的路线在这里完整且安全，但当前 Adaptive 模式选择过于保守，尚未提高 cross-stack
效率。未来应加入真正受限的跨层 payload、降低模式与 telemetry 开销，或在 Control 无法
稳定解决的任务中证明路由上下文能防错。候选研究中途不修改产品，先继续完成
memory-dependent 与 stale-memory 区块。
