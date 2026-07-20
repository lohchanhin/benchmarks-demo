# 候选验证：Decision-Memory 区块

状态：**decision-memory 完成 4/4 trial；16/16 Arm 有效，12/16 成功**。

完成本区块后，候选研究总进度为 12/16 trial、48 个 Arm、47 个有效、42 个成功。唯一的
无效 Arm 仍是先前已公开的 small-local 网络启动事故。

## 这一组测试什么

公开仓库刻意保留多个在局部看来都合理的 tenant 修复方向。预注册的私密分配决定每个 trial
真正由哪个独立治理 tenant 负责，隐藏 Oracle 再检查精确范围。Route-only 只能取得代码结构，
没有历史决策；Full 与 Adaptive 则会取得相关 Palace 记忆。

因此，这一组测试的是：记忆能否阻止一个“代码上合理、业务范围却错误”的修改，而不只是
协助 Agent 找到原本就能自行发现的文件。

## 完整性与基础设施

- 四个预注册 ID、cache state、seed 与 Williams 顺序都照计划执行。
- 私密分配键继续留在 Git 之外，并与公开 commitment 相符；本阶段报告不公开私密键。
- 防休眠守卫在整个区块保持 active，结束后正常释放。
- 目前 96 个公开证据文件全部通过 checksum 与隐私审计。
- 所有 Arm 都顺序执行，没有同时运行影响比较。

## 正确性结果

| Arm | 有效 | 隐藏 Oracle 成功 | 精确命中预期文件范围 |
| --- | ---: | ---: | ---: |
| Control | 4/4 | 3/4 | 3/4 |
| Route-only | 4/4 | 1/4 | 1/4 |
| Full Palace | 4/4 | 4/4 | 4/4 |
| Adaptive Palace | 4/4 | 4/4 | 4/4 |

主要的 Adaptive 对 Control 比较首次出现预期方向的 discordant pair：Control 修改了一个合理
但错误的 tenant，Adaptive 则选中隐藏 Oracle 指定的 tenant。没有出现 Control 成功而
Adaptive 失败。精确配对 McNemar p 值为 `1.0`，所以四个 trial **不能**证明统计显著。

Route-only 虽然完整找齐相关代码，却只成功一次。Full 相对 Route-only 有三组单向成功配对
（精确 p=`0.25`）。这项诊断证据说明：只知道代码结构，并不能补上缺少的历史决策。

## 路由与记忆保真度

12 个 Palace Arm 的 Route Recall@K 与 Precision@K 全部为 `1.0`。Adaptive 四次都选择
`guarded-memory-palace`，而且每次 payload 都报告：

- 2 条 memory candidate；
- 2 条 memory 纳入；
- 0 条 memory 排除；
- 没有采用错误记忆，也没有 pitfall violation。

因此，Adaptive 在本区块达到候选版的 memory-fidelity 要求。Adaptive payload 约 6.34 KB
（估计 1,585-1,595 Token），传统 Full Palace 则约 4.57 KB（估计 1,142-1,146 Token）。
额外 guardrail 与 telemetry 提高了可审计性，但没有缩小 payload。

## 配对效率结果

效率只比较双方都成功的配对，避免把错误答案误算成“便宜”。

| 比较 | Reported Token 配对中位差 | 工具调用配对中位差 | 墙钟时间配对中位差 |
| --- | ---: | ---: | ---: |
| Adaptive - Control | +22,438（95% bootstrap CI -97,887 到 +43,196） | +2（CI 0 到 +6） | -44.212 秒（CI -77.729 到 +14.799） |
| Adaptive - Full | +30,432（CI -25,931 到 +40,911） | -0.5（CI -11 到 +5） | -1.026 秒（CI -16.064 到 +24.272） |

区间都很宽且跨过零。本区块支持的是正确性与范围安全机制，不是省 Token 的结论。

## 阶段决定

这是候选研究第一次观察到记忆功能原本要提供的产品行为：相关历史把一个合理却错误的决定，
纠正为符合业务范围的修改。结果令人鼓舞，但 `n=4`，Adaptive 对 Control 也只有一组
discordant pair，仍属于探索性证据。产品代码继续冻结，先用最后的 stale-memory 区块确认
同一套机制能否安全拒绝过期建议。
