# 真实仓库 V5 静态路由测试报告

## 一句话结论

Vertex Palace 候选版在 **GitHub issue 补全后的中等规模路由**上比 npm `0.4.0` 明显改善，但整体仍未达到稳定资格：长任务在自适应模式中频繁撞上内部 context 上限，大型 Vitest 仓库仍会路由到错误子系统。静态门槛失败，因此按预注册协议没有执行 24 个 Codex Agent arms，也不能提出省 Token 或更快的声明。

## 测试对象

- 候选产品源码：`8f76d7a36f3430aa7b576c2462f8351936c31ae5`
- 候选 tarball SHA-256：`58ed1265e3ee79db936a6248e2e2b32643550555523bd9596645ec62ad1c7b9d`
- 基线：npm `vertex-palace@0.4.0`
- 基线 tarball SHA-256：`6fa6b17f62c172ab673d9423063849eb0254ba0e0d4c892f955cbce70986d425`
- 公开仓库：Click、Cobra、fd、Vitest
- 任务：12 个未用于旧轮调参的历史修复，每个条件重复 2 次
- 总观察数：候选 24 次 + 基线 24 次 = **48/48**
- 执行方式：独立父 commit、独立冷索引、候选/基线顺序平衡、严格串行

四种语言分别是 Python、Go、Rust、TypeScript；每种语言都包含本地信息完整、GitHub 引用补全、高连接度三类任务。

## 完整资格结果

**候选版未通过，Agent gate 关闭。**

| 指标 | 预注册门槛 | 候选结果 | 结论 |
| --- | ---: | ---: | --- |
| 完整观察数 | 24 + 24 | 24 + 24 | 通过 |
| Context 命令成功 | 100% | 14/24（58.3%） | 失败 |
| 可访问引用补全 | 100% | 8/8 | 通过 |
| 实现 + 聚焦测试角色闭合 | 100% | 8/24；4/12 个目标 | 失败 |
| 宏观核心覆盖率 | >= 0.90 | **0.354** | 失败 |
| 宏观 route focus | >= 0.70 | **0.198** | 失败 |
| 每目标核心覆盖率 | >= 0.50 | 4/12 个目标达到 | 失败 |
| 每目标 route focus | >= 0.40 | 3/12 个目标达到 | 失败 |
| 路线确定性 | 100% | 12/12 | 通过 |
| tracked 文件污染 | 0 | 0 | 通过 |
| Context 上限 | <= 6000 Token | 全部不超过 | 通过 |
| 过度自信 / 错误强停 | 0 | 0 / 0 | 通过 |

`explicitAuxiliaryCoverage100` 在原始机器结果中也失败，但事后方法审计发现该 gate 把隐藏 diff 中所有文档都错误视为“任务明确要求”。这项 gate 按实现无效处理；即使完全移除，其他六项有效硬门槛仍失败，最终结论不变。

## 按任务类型比较

以下覆盖率与 focus 均把命令失败记为 0，这是预注册的 fail-closed 口径。

| 类型 | 条件 | Context 成功 | 核心覆盖率 | Route focus | 角色闭合 |
| --- | --- | ---: | ---: | ---: | ---: |
| 本地信息完整 | 候选 | 2/8 | 0.063 | 0.042 | 0/8 |
| 本地信息完整 | npm 0.4.0 | 2/8 | 0.000 | 0.000 | 0/8 |
| GitHub 引用补全 | 候选 | **8/8** | **0.750** | **0.446** | **6/8** |
| GitHub 引用补全 | npm 0.4.0 | 8/8 | 0.250 | 0.188 | 0/8 |
| 高连接度 | 候选 | 4/8 | 0.250 | 0.107 | 2/8 |
| 高连接度 | npm 0.4.0 | 2/8 | 0.250 | 0.107 | 2/8 |

这说明候选版并非“完全没有进步”。最可信的改善集中在引用补全：候选对 Click、Cobra、fd 的 issue 都同时命中实现与测试，而 npm 基线没有任何引用补全目标形成角色闭合。但 Vitest 引用任务仍错误命中 UI visual-regression 文件，证明“成功读取 issue”不等于“成功找到源码”。

## 逐目标结果

| 目标 | 候选核心覆盖 | 候选 focus | 候选角色闭合 | 主要观察 |
| --- | ---: | ---: | --- | --- |
| Click color exception | 0.00 | 0.00 | 否 | 3,627 > route-lite 2,400，context 拒绝 |
| Click Windows pager | 1.00 | 0.286 | 是 | 核心闭合，但路线 7 个文件且未含 CHANGES |
| Click Choice message | 0.00 | 0.00 | 否 | 3,077 > 2,400，context 拒绝 |
| Cobra completion os.Args | 0.00 | 0.00 | 否 | 2,814 > 2,400，context 拒绝 |
| Cobra help context | **1.00** | **1.00** | 是 | 精确命中 `command.go` 与 `command_test.go` |
| Cobra dead-code elimination | 0.00 | 0.00 | 否 | 2,659 > 2,400，context 拒绝 |
| fd ignore-contain | 0.00 | 0.00 | 否 | 2,538 > 2,400，context 拒绝 |
| fd Windows hyperlink | 1.00 | 0.50 | 是 | 核心闭合，另带两个相关度较低文件 |
| fd exact match | 1.00 | 0.429 | 是 | 核心闭合，但路线扩张到 7 个文件 |
| Vitest setup hooks | 0.25 | 0.167 | 否 | 只命中测试，遗漏三个运行时实现文件 |
| Vitest process hang | 0.00 | 0.00 | 否 | 错误路由到 UI visual-regression 子系统 |
| Vitest todo reporters | 0.00 | 0.00 | 否 | 路由到 GitHub Actions reporter 与无关测试 |

## 最关键的产品发现

### 1. 自适应模式与输出预算互相冲突

候选 10/24 次 context 失败，集中在五个目标，每个重复两次。它们不是网络、编译器、依赖或并发错误，而是 Palace 已完成模式选择后发现：仅 JSON 元数据就超过该模式的内部上限。用户传入 `--budget 6000`，但 `route-lite` 仍以 2,400 Token 失败关闭。

下一版应先解决通用预算契约：模式选择必须提前考虑序列化后固定开销；必要时压缩解释、减少重复字段或升级模式，但不能先选择 2,400 上限再因元数据 3,000+ 而整次拒绝。

### 2. 引用补全机制有效，但语义落点仍不稳定

冻结缓存 8/8 成功，说明 GitHub URL 解析、缓存与 task grounding 已可靠。Click、Cobra、fd 的候选路线明显优于 npm 基线；Vitest 则读取了正确 issue，却进入错误 UI 房间。后续需要改善“补全后的领域词 -> 仓库符号/目录”映射，而不是继续为单个 issue 增加关键词规则。

### 3. 大型 monorepo 仍是主要风险

三个 Vitest 任务中，候选没有一个实现/测试角色完整闭合。错误候选集中在 coverage、UI、GitHub Actions reporter 等高连接度区域，说明当前路径/词频分数仍容易被大型仓库的高频节点吸走。

推荐的产品方向是通用证据面竞争：实现候选与聚焦测试必须形成可解释连接；高连接度节点需要更强惩罚；如果任务语义与候选子系统缺乏共同标识符，应保持 advisory 或拒绝强停。

## 候选相对 npm 0.4.0

- Context 成功：候选 14/24，基线 12/24。
- 在“成功输出”的子集里，候选平均核心覆盖 0.607、focus 0.340；基线为 0.333、0.196。这个子集受成功选择偏差影响，只能描述，不能作为正式优势声明。
- 引用补全层的改善最稳定：候选核心覆盖 0.750、focus 0.446、角色闭合 6/8；基线为 0.250、0.188、0/8。
- 候选平均索引时间 23.3 秒，基线 23.9 秒；成功 context 平均约 8.2 秒与 7.2 秒。没有配对区间，也没有 Agent 正确率，因此不作速度声明。

## 研究完整性与限制

第一次正式调用暴露候选 context 错误时，原 runner 直接终止。该结果已原样公开；唯一 amendment 只是把非零退出记录成失败观察并继续，未修改产品、包、目标、oracle 或阈值。因此本轮定位为**冻结诊断与回归轮**，不再声称是未触碰的稳定资格盲测。

本轮只测静态路由，不测最终代码正确率、reported Token 或 Agent 墙钟时间。由于静态门槛失败，Agent arms 为 **0**；任何“省 Token”“更快”“提高任务成功率”的说法都不由 V5 支持。

## 后续方向

1. 修复通用 context 预算契约，并将本轮五类超限目标转成只读回归测试。
2. 将附属真值明确拆成 `explicitAuxiliaryFiles` 与 `latentAuxiliaryFiles`，用全新目标重新冻结研究。
3. 针对 monorepo 实现“实现 + 聚焦测试关系闭合”和高连接度惩罚，不加入仓库名或 issue 编号规则。
4. 通过新的两轮静态资格后，才恢复 24 个 Palace/Control Agent arms。
5. 在那之前不更新 npm `latest` 的性能宣传，也不宣称稳定版达到 0.5/1.0 目标。

## 证据入口

- 冻结目标：[`protocol/v5/targets.frozen.json`](../../protocol/v5/targets.frozen.json)
- 语义审查：[`protocol/v5/semantic-review.json`](../../protocol/v5/semantic-review.json)
- 执行绑定：[`protocol/v5/execution.binding.json`](../../protocol/v5/execution.binding.json)
- 执行修订：[`protocol/v5/execution.amendment-1.json`](../../protocol/v5/execution.amendment-1.json)
- 第一次中断：[`results/real-repository-v5/attempt-1-harness-failure.json`](../../results/real-repository-v5/attempt-1-harness-failure.json)
- 48 次原始观察与机器分析：[`results/real-repository-v5/static-results.json`](../../results/real-repository-v5/static-results.json)
- Agent gate：[`results/real-repository-v5/agent-gate.json`](../../results/real-repository-v5/agent-gate.json)
- 事后方法审计：[`results/real-repository-v5/method-audit.json`](../../results/real-repository-v5/method-audit.json)
