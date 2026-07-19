# Control-first v3 协议辅助说明

状态：**设计审核草案、0 个 Agent 结果、目前禁止执行正式实验**。

英文权威协议是 [`PROTOCOL_V3.md`](../research/PROTOCOL_V3.md)，草案计划是
[`results/control-first-v3/plan.json`](../../results/control-first-v3/plan.json)。
计划目前明确写着 `frozen:false`；产品、安装与测试闸门全部通过后，才会冻结、
打 `protocol-v3.0.0` tag，再开始正式 trial。

## 为什么需要 v3

v2.2 证明了 Palace 能提供结构化路线、防护上下文和可审核记录，但没有证明它
相对普通 Codex 普遍更省 Token 或更快。v2.2 的主比较还是 Adaptive 对 Full
Palace，而且旧 useful-memory 情境中 Control 也全部成功，无法证明记忆改善了
正确性。

v3 的主问题改成：

> Adaptive Palace 在选择 bypass 或受限上下文之后，是否优于完全不使用 Palace
> 的普通 Codex？

实验没有预设 Palace 会赢。持平、变慢、Token 更多、被记忆误导或结果不确定，
都会原样发表。

## 比较顺序

1. 主比较：Adaptive Palace 对 Control。
2. 次比较：Adaptive Palace 对 Full Palace。
3. 机制分析：Route-only 对 Control。
4. 机制分析：Full Palace 对 Route-only。

先判断正确性与修改范围，再比较效率。唯一主要效率指标是配对累计
`reportedTokens`；uncached input、工具调用、墙钟时间等都是次要指标。

## 四个测试情境

| 情境 | 测什么 |
| --- | --- |
| `small-local-bug` | 单文件任务是否真正 bypass |
| `cross-stack-regression` | 跨前后端依赖是否被完整覆盖 |
| `decision-memory-dependent` | 历史决策能否避免选错 tenant 与扩大修改 |
| `stale-memory-adversarial` | 过期记忆是否会被当前代码与测试否决 |

旧的 `tenant-memory-pitfall` 不进入 v3，因为 v2.2 中 Control 也 4/4 成功，
它无法产生有辨识力的记忆效益证据。

## 真正依赖记忆的设计

新任务只说“独立治理的 launch tenant”，源码中存在多个合理候选。公开测试只
验证通用 resolver，所以原始代码会通过公开测试；hidden oracle 才知道历史
决定指定 Aurora，并检查 Aurora 达到 WCAG AA、shared、Borealis 与 Cedar
保持不变。

Palace memory 会告诉 Agent “Aurora 是 launch tenant、token 属于 client 自己、
不要改 shared”，但不会给新颜色或可直接复制的 patch。原始 baseline 必须是：

- 公开测试通过；
- hidden oracle 失败；
- canonical 单文件修复后两者都通过。

只有出现具名 discordant pair，例如 Control 失败而 Adaptive 成功，或 Control
扩大修改但 Adaptive 没有，才能说观察到记忆正确性效益。没有这种结果，就不能
宣称 memory benefit。

## v3 成功条件

正式成功必须同时满足：Arm 有效、任务文字一致、Codex 正常结束、公开测试与
hidden oracle 通过、没有 forbidden edit、changed-file precision 为 100%，
changed-file recall 也为 100%。功能虽然正确但多改了文件，在 v3 仍算失败。

## 实验规模与顺序控制

计划包含 4 个情境 x 4 个全新 seed x 4 个 Arm，共 16 个 trial、64 个全新
Codex Session。每个情境完整轮换四条 Williams 顺序，使每个 Arm 在四种执行
位置各出现一次；warm/cold 本地 Palace index 也平衡。四个 Arm 永远依序执行，
不会同时执行，因此不会把并发资源竞争混进比较。

## 发布与冻结闸门

正式实验前必须先完成：Palace 0.3.0 单元、CLI、MCP、打包与 CI；clean install；
记忆检索 smoke；固定 commit 的 TypeScript 与 Python 真实仓库目标检索；本 benchmark
全套测试；npm 上不可变的 0.3.0 安装；确认公开 manifest 仍为 0 个结果。之后才把
`frozen` 改为 `true` 并打协议 tag。

npm 发布不会现在进行。工程与研究闸门通过后，才使用浏览器／设备验证码让使用
者扫码确认，再完成发布。

冻结前已经发现并修复的两次 memory smoke 问题、最终 clean-package 结果与 CI
证据记录在 [`CONTROL_FIRST_V3_PREFLIGHT.md`](../research/CONTROL_FIRST_V3_PREFLIGHT.md)。
这份记录属于工程 preflight，不是正式 Arm 数据。

真实仓库门槛现已通过：Zod 与 Requests 的已知目标召回率均为 1.000，但严格精度
均为 0.333。结果证明固定案例的检索可重复，不证明 Agent 已节省 Token 或时间。
