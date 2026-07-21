# 真实仓库 V4 最终报告

状态：**已完成、结果已锁定、已揭盲、可复算**

协议：`4.0.0-candidate.1`

产品：`vertex-palace@0.3.0`，源码提交 `322b15ec6cbbbc9c86f0a03e54e7a13ebf050c5e`
结果锁定提交：`cc493b198bdff95138805b18b2b4dff2dec940ee`

[English](../research/REAL_REPOSITORY_V4_FINAL.md) | [冻结协议](PROTOCOL_V4_CANDIDATE.md) | [机器分析](../../results/real-repository-v4/analysis.json) | [揭盲记录](../../results/real-repository-v4/blinding-reveal.json) | [事后机制审计](../../results/real-repository-v4/mechanism-audit.post-hoc.json)

## 结论先说

这次研究**不支持**把 Vertex Palace 0.3.0 当成真实仓库任务中普遍优于普通
Codex 的正确性或效率增强。Adaptive Palace 严格成功 **3/16**，Control
严格成功 **11/16**。配对成功率差为 -50 个百分点，95% 分层 bootstrap
区间为 -62.5 到 -37.5 个百分点，双侧精确 McNemar `p=0.0078125`。
共有 8 组是 Control 单独成功，Palace 单独成功为 0 组。

Adaptive 在若干描述性 Token 指标上读得更少，但这不等于效率更高，因为它
失败得更多。计入重试后，每个严格成功的墙钟成本为 **40.59 分钟**，Control
为 **10.31 分钟**。Adaptive 每个成功至少消耗 **7.30M reported Tokens**，
Control 为 **2.73M**；Adaptive 只能报告下界，因为一次 900 秒超时没有产生
最终 usage 事件。

这次最有价值的是诊断结果：0.3.0 确实经常让 Agent 少读，但当前有界路线没有
为这些真实 Issue 保留足够证据。

## 研究设计

- 四个固定提交上的公开真实 Issue：Zod #4926、Open WebUI #25919、
  Zod #5509、Requests #7432。
- 每个 Issue 四组隔离配对重复，共 16 个 trial、32 个 Agent arm。
- 每个 Issue 两次 cold、两次 warm，AB/BA 顺序平衡。
- 每个 arm 都使用全新 workspace 与 Agent session，Agent 执行期间断网。
- Codex 版本、模型、runtime、依赖、Palace tarball 与 runner 哈希在执行前冻结。
- evaluator 私有 oracle 负责正确性与精确修改范围评分；其 commitment 在执行前冻结。
- 32 个结果全部提交后才揭盲；公开密钥可以重建全部分配，但不会公开私有 oracle。

Requests 的一个 Adaptive 初始尝试在最终 usage 事件出现前超时。预注册允许的基础设施
重试随后完成。超时的 900,215 ms 已计入时间成本；无法观察的 Token 成本记为
`null`，绝不当成 0。

## 主要结果

所有差值方向都是 Adaptive 减 Control。

| 指标 | Adaptive | Control | 差值（95% 配对分层 bootstrap） | 精确配对 p |
| --- | ---: | ---: | ---: | ---: |
| Oracle 正确性 | 5/16（31.25%） | 12/16（75.00%） | -43.75 pp（-50.00 至 -31.25） | 0.015625 |
| 严格成功 | 3/16（18.75%） | 11/16（68.75%） | -50.00 pp（-62.50 至 -37.50） | 0.0078125 |
| 精确修改范围 | 10/16（62.50%） | 15/16（93.75%） | -31.25 pp（-50.00 至 -12.50） | 0.0625 |
| 禁止文件违规 | 2/16（12.50%） | 1/16（6.25%） | +6.25 pp（0 至 +18.75） | 1.0 |

严格成功要求同时满足 oracle 正确、修改范围完全准确、没有禁止文件、diff 有效且
执行完成。研究没有进行任何依结果而定的排除。

冻结的层级比较得到 Adaptive 7 胜、Control 9 胜，忽略平局的 `p=0.8036`。
这不能覆盖严格成功率。Adaptive 的 7 胜中包括双方都错误、最后由较低 Token 选出的
失败答案；成本较低的错误答案不是成功解法。

## 不同任务类型

每个类型只有四组，以下只能作为描述性结果。

| 真实 Issue 类型 | Adaptive 成功 | Control 成功 | 层级 A/C | reported Token 中位差 | 未缓存输入中位差 | 时间中位差 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Zod transform/refine，小范围 | 1/4 | 4/4 | 1 / 3 | +257,625.5 | +0.5 | +11.482 秒 |
| Open WebUI analytics，跨栈 | 0/4 | 4/4 | 0 / 4 | -1,287,951 | -29,244.5 | -46.476 秒 |
| Zod report-input，决策任务 | 2/4 | 3/4 | 3 / 1 | -387,839 | -20,061 | +24.871 秒 |
| Requests stream，过期记忆 | 0/4 | 0/4 | 3 / 1 | -608,595 | -32,772 | -99.574 秒 |

跨栈任务是最明确的警告：Adaptive 四次都错误，Control 四次都成功，因此 Adaptive
报告更少 Token 主要代表更早失败。过期记忆任务则双方全错，Token 与层级胜负都不能
说明任务价值。

## 成本与 Token

| 指标 | Adaptive | Control | 解读 |
| --- | ---: | ---: | --- |
| 最终尝试 reported Tokens | 21,887,074 | 30,068,933 | Adaptive 总量较低，但成功数是 3 对 11。 |
| 最终尝试未缓存输入 | 1,298,001 | 1,693,306 | reported input 大量来自缓存，必须分开看。 |
| 全部尝试墙钟时间 | 121.77 分钟 | 113.45 分钟 | Adaptive 包含超时与重试。 |
| 每个严格成功的时间 | 40.59 分钟 | 10.31 分钟 | Adaptive 每个成功多 30.28 分钟。 |
| 每个严格成功的 reported Tokens | 至少 7.30M | 2.73M | Adaptive 因重试 usage 缺失只能报告下界。 |
| 成功答案的平均 Tokens | 0.935M，n=3 | 2.158M，n=11 | 成功子集不同，必须连同成功率一起读。 |

按 16 组最终尝试做配对描述，Adaptive 的 reported Tokens 中位差为 -221,872，
95% 区间 -666,550 至 -42,951；未缓存输入中位差为 -24,687，区间
-29,244.5 至 -21,804.5。工具调用中位差为 +3，区间 -0.5 至 +8。最终尝试
时间中位差为 -18.181 秒，区间 -49.728 至 +38.203；计入重试后为 +3.070 秒，
区间 -46.476 至 +39.095。这些都是次要描述性结果。reported Tokens 包含缓存输入，
也不是直接账单金额。

## 事后机制审计

这一节在结果锁定后才进行，只用于解释机制与指导研发，不能替代主要分析。公开产物
只包含脱敏聚合 telemetry 与源文件哈希，不公开原始 Agent events。

- 16/16 个 Adaptive arm 都收到完全一致的任务文本，排除了早期研究遇过的任务传输错误。
- Adaptive 选择 `full-palace` 8 次、`guarded-memory-palace` 8 次；
  `bypass` 与 `route-lite` 合计 **0 次**。
- Palace 相关调用中位数为 3；context payload 中位数约 3,640.5 estimated Tokens。
- 决策记忆 fixture 四次都收到 0 条 memory，尽管进入 guarded 模式；过期记忆 fixture
  四次都收到 1 条旧记忆与 2 条 guardrail。

Palace 自身 payload 太小，不足以单独解释百万级 run totals。更合理但仍属事后提出的
假设是：路线与停止契约改变了 Agent 检查什么、何时停止。这个假设必须用新协议验证。

## 研发决定

不要把 0.3.0 宣传成比 Codex 更快、更省或更正确。保留当前 release 与这次负结果作为
基线。下一轮先修正确性，再谈效率：

1. 默认把路线改为建议，不得在依赖与测试覆盖仍未知时禁止扩大检查范围。
2. 增加证据充分性闸门；任务意图覆盖不足、跨栈依赖缺失或决策来源缺失时必须返回
   `insufficient`，不能给高置信有界上下文。
3. 分离路线置信度、记忆置信度与任务置信度，并说明资料为何存在、缺失、过期或冲突。
4. 下一次 Agent 实验前，先为真实 Issue 建立实现文件、测试、间接依赖与 owner decision
   的固定 retrieval gate。
5. 重做 `palace evaluate`：重点检查遗漏的必要文件与不合理停止，而不只是确认改动文件
   是否曾出现在路线里。
6. 未来改成 advisory treatment 后，必须使用全新 Issue、trial ID 与冻结协议；不能覆盖
   V4，也不能把 V4 数据重新当成确认样本。

## 复算公开结果

以下命令不会重新执行高成本 Agent session：

```bash
npm ci
npm run verify:retry-cost:real-repository:v4
npm run verify:reveal:real-repository:v4
npm run verify:analysis:real-repository:v4
npm run verify:mechanism-audit:real-repository:v4
```

32 份公开 evidence、锁定 manifest、揭盲密钥、脱敏重试成本、机器分析与事后 telemetry
都位于 [`results/real-repository-v4/`](../../results/real-repository-v4/)。

## 限制

这是四个 Issue、单一 Windows 机器、单一 Codex build、单一模型配置与单一产品版本的
探索性研究。同一 Issue 的四次重复不是四个独立仓库。隐藏 oracle 已提交 commitment
但不公开内容，因此独立评估者可以核对哈希，却无法只靠公开仓库重建私有验收细节。
结果足以否定“本样本已证明有收益”，但不能证明 Palace 在任何仓库任务中永远没有帮助。
