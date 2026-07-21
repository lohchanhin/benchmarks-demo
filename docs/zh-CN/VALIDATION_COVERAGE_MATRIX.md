# 验证覆盖矩阵

日期：2026-07-22

[English](../research/VALIDATION_COVERAGE_MATRIX.md) | [机器可读矩阵](../research/evidence/validation-coverage-matrix-2026-07-22.json)

## 为什么需要这份矩阵

Vertex Palace 目前有不同层级的证据：确定性路由闸门不等于 Agent A/B，fixture 预跑
不等于真实仓库结果，旧版探索性研究也不等于当前公开 0.3.0 的结论。这份矩阵把边界
直接呈现给评审，也防止后续开发把工程 smoke 包装成性能胜利。

Palace 为这份矩阵规划的路线在 7 个实际文件中命中 `0/7`（coverage `0`、focus `0`、
confidence `0.35`）。路线停留在 fixture 源码，漏掉双语矩阵、机器证据、导航入口与直接
测试，因此属于过度自信的 `needs-review`。这项负结果继续公开，说明文档与 claim
inventory 类任务仍是明显弱项。

## 研究如何一路演进

### 第一次研究：固定 Palace treatment（v1.0.0）

第一次预注册研究使用 4 个确定性合成仓库，每个场景 5 个配对 trial，每个 trial 顺序
执行 Control、Route-only、Full Palace 三个 Arm。协议、seed、model、timeout、评分规则
和隐藏 Oracle 都在看到结果前冻结；只有配对双方都有效且成功时才比较效率。

20 个 trial、60 个 Arm 全部通过，因此没有观察到正确性下降。但 Full Palace 相对
Control 的配对中位数多 67,223.5 reported tokens（95% 区间 25,362.5 到 112,437.5）、
8.5 次工具调用（6 到 16）和 29.8 秒（16.4 到 49.2）。记忆没有提高租户任务正确性，
因为 Control 与 Route-only 也避开了陷阱。Full 在 5/5 过期记忆任务中拒绝旧建议，
属于安全价值，不是效率胜利。

### 第二次研究：Adaptive Palace（v2.2）

第二次加入 Adaptive 第四组，研究模式选择能否避免 Full Palace 的固定成本。4 个场景
各 4 个 trial，采用平衡 Williams 顺序、每场景 2 次 warm 与 2 次 cold index、顺序执行、
公开测试、隐藏 Oracle，并在 `protocol-v2.2.0` 先冻结。较早的 v2.0 因 PowerShell 把
三个任务文字中的 `$0.00` 改写而无效；v2.1 又因 Windows split writable roots 导致
patch verification 失败而停止。两次失败都没有删除。

v2.2 的 16 个 trial、64 个 Arm 全部有效且成功。Adaptive 相对 Full 的 Palace 自身
输出少 898.5 bytes，区间完全低于 0；但端到端 Token、调用与时间区间都跨 0。相对
Control，Adaptive 中位数多 30,147 reported tokens 与 10.919 秒，两者区间跨 0；工具
调用多 4.5 次，95% 区间为 2.5 到 6.5。研究也发现 0.2.1 Adaptive 在 useful-memory
场景 4/4 都漏掉记忆。被支持的价值是更小且可审计的路由输出与过期记忆防护，不是
普遍速度或 Token 优势。

### 第三次研究：Control-first v3（0.3.0）

这些负结果直接推动 0.3.0 加入 true bypass、明确记忆 telemetry、范围化 guardrail、
执行边界、置信度校准和精确安装包来源。独立的非正式候选研究用同一份精确候选 tarball
完成 16 trial、64 Arm，观察到一次记忆依赖范围纠正，也安全处理过期记忆；同时发现
Adaptive 相对 Control 仍有系统性开销。随后两组全新 small-local 配对出现范围较窄但方向
一致的改善，0.3.0 因此完成发布，但没有把这项探索性结果写成普遍加速结论。正式协议随后
完成 16/16 trial、64/64 有效 Arm。Adaptive 成功 16/16，Control 成功 13/16；三次不同
结果都是隐藏历史决策范围错误。13 对双方成功结果的 Token、时间与 calls 区间都跨 0。
私密分配键只在提交 `0c81fb2` 锁定全部结果后揭盲。

### 第四次研究：真实仓库 V4（0.3.0）

V4 从合成 fixture 转向四个固定提交上的公开真实 Issue：两个 Zod 任务、一个
Open WebUI 跨栈任务与一个 Requests 过期记忆任务。协议、隐藏 oracle commitment、
盲测分配、runtime、依赖、模型、runner 与精确 0.3.0 tarball 都在 16 组配对 trial、
32 个隔离 Agent arm 前冻结。全部结果先提交到
`cc493b198bdff95138805b18b2b4dff2dec940ee`，随后才揭盲。

Adaptive Palace 严格成功 3/16，Control 成功 11/16。配对差 -50 个百分点，精确
McNemar `p=0.0078125`，Palace 单独成功为 0。Adaptive 的描述性 reported 与未缓存
Tokens 较少，但因失败更多，计入重试后的单位成功成本明显更高。这是当前版本与本次
样本的已完成负面探索证据，不是“路由在任何任务中永远无效”的普遍证明。

## 当前覆盖

| 验证面 | 状态 | 证据 | 客观解释 |
| --- | --- | --- | --- |
| 本地干净安装、CLI 与 MCP | **产品闸门已验证** | 0.3.0 的 7 文件 tarball、干净安装、10 个 MCP 工具、跨平台 CI | 精确候选包在发布前已通过，现已公开；这不是 Agent 对照实验。 |
| TypeScript monorepo 路由 | **产品闸门已验证** | 固定 Zod，重复两次边界一致，recall 1.000、严格 precision 1.000 | 只证明这一个固定 issue 任务能找对实现与测试。 |
| Python 仓库路由 | **产品闸门已验证** | 固定 Requests，重复两次边界一致，recall 1.000、严格 precision 1.000 | 只证明这一个固定 issue 任务能找对实现与测试。 |
| 独立 small-OSS 分层 | **尚未单独测试** | Requests 有 123 个索引文件，但没有预注册尺寸阈值 | 不能看完结果后才把 Requests 改称 small OSS；未来需独立定义。 |
| 真实仓库 issue 型任务 | **已完成的探索性负面证据** | V4：4 个 Issue、16 组配对、32 个隔离 arm；Adaptive 3/16、Control 11/16 | 受测 0.3.0 treatment 减少描述性上下文，却明显降低严格成功率。 |
| 真实仓库历史决策任务 | **已完成的探索性负面证据** | Zod #5509：Adaptive 2/4、Control 3/4；Requests 过期记忆：双方 0/4 | 当前记忆选择没有改善这两个真实任务；事后审计中决策任务四次都选入 0 条记忆。 |
| 真实仓库跨栈实现 | **已完成的探索性负面证据** | Open WebUI #25919：Adaptive 0/4、Control 4/4 | Adaptive Token 较少来自错误答案，不是有效加速。 |
| 真实仓库 architecture/refactor | **尚未测试** | 无 | 跨模块架构覆盖仍未知。 |
| 真正 Adaptive bypass 契约 | **候选证据** | 0.3.0 候选：3/3 个有效 small-local run 都选 bypass；177-byte payload | Palace payload 变小，但相对 Control 的 Agent 总成本仍多 +14,029 Token、+2 calls。 |
| 修订版 small-local bypass | **候选研究后的探索性证据** | 最终候选：2 组反向顺序配对、8/8 Arm 有效且成功；65-token payload；Adaptive 相对 Control 中位数 -17,316.5 reported tokens、-9.445 秒、+1 call | 移除 package 重读后，两组方向一致；但 n=2 且一组 Control 有 router error，不能推论普遍效果。 |
| 记忆依赖租户 fixture | **候选探索性证据** | 4 trial：Adaptive、Full 4/4；Control 3/4；Route-only 1/4 | 阻止一次 Control scope violation；精确配对 p=1.0，尚未建立统计正确性效果。 |
| 过期记忆抵抗 | **候选探索性证据** | 0.3.0 候选：4 trial、16/16 Arm 成功、零 wrong-memory adoption | Guardrail 安全，但 Adaptive 把两条 stale memory 当成警告带入，没有排除。 |
| Adaptive 对 Control 效率 | **候选负面证据** | 14 对共同成功：Adaptive +19,922.5 Token、+10.135 秒、+2.5 calls；三个 95% CI 都高于 0 | 受测 0.3.0 候选没有提高端到端效率，不应宣传成加速。 |
| Control-first v3 正式研究 | **已完成的探索性证据** | 16/16 trial；64/64 有效 Arm；Adaptive 16/16、Control 13/16；128 份 checksum 证据；结果锁定后揭盲 | 合成历史决策阻止三次 Control 范围错误；整体效率区间跨 0，原始精确 p=0.25。 |
| npm 公共安装与 Codex 插件安装 | **发布闸门已验证** | npm latest `0.3.0`；SHA-1 `9a04440d...`；全新 registry 安装；GitHub Release `v0.3.0`；隔离 Codex marketplace 与插件安装 | 公开包与插件路径可安装；这只验证分发，不代表 Agent 效率胜利。 |

## 目前可以说

- 真实仓库 V4 中，Adaptive Palace 0.3.0 严格成功 3/16，Control 成功 11/16；
  Palace 单独成功为 0，精确配对 `p=0.0078125`。
- Adaptive 的描述性 Token 总量较低，但全部尝试的单位成功成本显著更高；本样本中
  “读得更少”没有保住正确性。
- 32 份 V4 公开 evidence 哈希与 32 个揭盲分配全部可从锁定结果验证；原始 Agent
  events 与 oracle 细节仍保持私有。
- 打包后的 0.3.0 候选在固定 Zod 与 Requests 任务中，能稳定只返回已知实现和聚焦测试。
- 候选版具有紧凑的真正 bypass 契约，也能审计记忆纳入与排除原因。
- 完成的非正式候选研究中，Adaptive 阻止一次 Control tenant-scope 错误，也没有采用
  stale memory。
- 同一轮候选研究也发现：双方都成功时，Adaptive 的端到端 Token、时间与调用成本高于
  Control。
- 正式 v3 中，Adaptive 完成 16/16，Control 完成 13/16；Adaptive 避开 Control 出现的
  三次禁止租户范围修改。
- 正式 v3 没有建立普遍效率效果：13 对双方成功结果中，Adaptive - Control 为
  -806 reported tokens、+2.963 秒与 0 calls，三个区间都跨 0。
- 两组全新最终候选 small-local 配对中，Adaptive 都只检索一个文件，也都比 Control
  使用更少 reported tokens 与墙钟时间；这是候选研究后的探索性证据，不是普遍结论。
- 已保留的 v2.2 说明 Adaptive 相对 Full 缩小 Palace 自身 payload，但没有证明相对
  Control 的端到端 Token 或时间下降。
- `vertex-palace@0.3.0` 已可从 npm 公共安装，GitHub `v0.3.0` marketplace 也能在隔离
  Codex 配置中安装 0.3.0 插件。
- v3 计划与 benchmark 安装匹配不可变的公开 0.3.0 metadata，19 项改绑闸门全部通过，
  16 项结果已经发布，揭盲能重现每项隐藏分配 commitment。

## 目前不能说

- Vertex Palace 普遍节省 Agent Token、时间或工具调用。
- Vertex Palace 在真实仓库上比普通 Codex 更正确；V4 八组成功率不一致配对全部是
  Control 单独成功。
- 四个 Issue 足以代表不同仓库尺寸、语言、组织、architecture/refactor 或未来
  Codex build 的表现。
- 公开发布 0.3.0 本身证明端到端 Agent 性能更好。

## 下一批证据

1. 把 Palace 重做为建议式证据优先级：加入明确的 `insufficient` 状态、依赖覆盖检查，
   在正确性证据不足前不得给限制性停止契约。
2. 下一轮 Agent 研究前，先为实现文件、测试、间接依赖与 owner decision 建立固定
   retrieval gate。
3. 产品修改完成后，用全新 Issue 与 trial ID 预注册 V5；不得覆盖 V4 或把 V4 数据
   重新当成确认样本。
4. 寻找另一个操作系统、Codex build、机器与 evaluator 自有 oracle 的独立复验。
