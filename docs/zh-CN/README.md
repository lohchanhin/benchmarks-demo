# 简体中文辅助文档

这组中文文档帮助比赛评审、开发者和研究读者快速理解并验证
`benchmarks-ab-demo`。它们是导航与解释层，不是新的研究协议，也不会改变已
冻结的任务、版本、随机 seed、分析方法或结果。

[项目中文首页](../../README.zh-CN.md) | [第四代真实仓库候选协议](./PROTOCOL_V4_CANDIDATE.md) | [v3 正式最终报告](./CONTROL_FIRST_V3_FINAL.md) | [验证覆盖矩阵](./VALIDATION_COVERAGE_MATRIX.md) | [修订版 Bypass 工程确认](./REVISED_BYPASS_CONFIRMATION.md) | [0.3.0 候选最终结果](./CONTROL_FIRST_V3_CANDIDATE_FINAL.md) | [快速验证指南](./QUICKSTART.md) | [v2.2 结果阅读指南](./RESULTS_GUIDE.md) | [Control-first v3 协议](./PROTOCOL_V3.md) | [v2.2 英文最终报告](../research/ADAPTIVE_V2_2_FINAL.md)

## 按目的阅读

| 目的 | 从这里开始 | 是否启动 Codex Agent |
| --- | --- | --- |
| 快速判断研究结论 | [结果阅读指南](./RESULTS_GUIDE.md) | 否 |
| 查看 0.3.0 正式 Control 对照结果 | [v3 正式最终报告](./CONTROL_FIRST_V3_FINAL.md) | 否 |
| 查看 0.3.0 候选是否适合发布 | [候选验证最终报告](./CONTROL_FIRST_V3_CANDIDATE_FINAL.md) | 否 |
| 查看修订版是否减少重复检查 | [修订版 Bypass 工程确认](./REVISED_BYPASS_CONFIRMATION.md) | 否 |
| 区分已验证、预跑、旧版证据与空白 | [验证覆盖矩阵](./VALIDATION_COVERAGE_MATRIX.md) | 否 |
| 验证代码、fixture、冻结计划和公开 evidence | [快速验证指南](./QUICKSTART.md#快速验证不执行-agent) | 否 |
| 重算已发表的聚合分析 | [快速验证指南](./QUICKSTART.md#重新生成聚合分析) | 否 |
| 查看实验方法 | [英文方法说明](../../METHODOLOGY.md) | 否 |
| 审核预注册内容 | [v2.2 冻结协议](../research/PROTOCOL_V2_2.md) | 否 |
| 审核第三代冻结设计 | [Control-first v3 中文协议](./PROTOCOL_V3.md) | 否 |
| 审核第四代真实仓库候选与冻结闸门 | [第四代候选协议](./PROTOCOL_V4_CANDIDATE.md) | 否，尚未允许正式执行 |
| 复现一个真实 Agent trial | [完整复现说明](./QUICKSTART.md#完整-agent-复现高成本) | 是，成本较高 |
| 准备比赛展示 | [三分钟影片辅助流程](./QUICKSTART.md#三分钟影片辅助流程) | 建议播放已录制证据 |

## 30 秒结论

- v3 完成 16/16 trial、64/64 有效 Arm；Adaptive 成功 16/16，Control 成功 13/16。
- 三次差异都来自隐藏历史决策任务；Adaptive 修改范围正确，Control 三次违反租户范围。
- 这个正确性信号的原始精确配对 p=0.25，Holm 校正后 p=1.00，样本仍不足以建立普遍效果。
- 13 对双方成功结果中，Adaptive - Control 为 -806 reported tokens、+2.963 秒、0 calls，三个区间都跨 0。
- 因此 v3 支持“记忆能在特定模糊决策中防止范围错误”，不支持“Vertex Palace 普遍省 Token 或更快”。
- 以下 v2.2 结果保留为上一代历史证据。
- v2.2 完成 16/16 trial、64/64 Arm；所有 Arm 都有效、正确、范围合规，并通过公开测试与隐藏 Oracle。
- Adaptive 相对 Full Palace 的 Palace 自身 payload 中位数少 898.5 bytes，且这项配对区间没有跨越 0。
- Adaptive 相对 Full 的端到端 reported tokens、uncached input、工具调用和时间区间都跨越 0。
- Adaptive 相对不使用 Palace 的 Control，中位数多 30,147 reported tokens、4.5 次工具调用和 10.919 秒；工具调用区间完全高于 0。
- 因此本研究支持“路线与防护上下文可审计”，不支持“Vertex Palace 普遍省 Token 或更快”。

## 哪些文件是权威来源

| 内容 | 权威来源 |
| --- | --- |
| v3 最终结论与限制 | [`CONTROL_FIRST_V3_FINAL.md`](./CONTROL_FIRST_V3_FINAL.md) |
| v3 机器分析与揭盲 | [`analysis.json`](../../results/control-first-v3/analysis.json) 与 [`blinding-reveal.json`](../../results/control-first-v3/blinding-reveal.json) |
| v3 每项公开证据 | [`results/control-first-v3/`](../../results/control-first-v3/) |
| 冻结设计与有效性规则 | [`PROTOCOL_V2_2.md`](../research/PROTOCOL_V2_2.md) 与 tag `protocol-v2.2.0` |
| 最终结论与限制 | [`ADAPTIVE_V2_2_FINAL.md`](../research/ADAPTIVE_V2_2_FINAL.md) |
| 机器可读聚合结果 | [`results/adaptive-pilot-v2.2/analysis.json`](../../results/adaptive-pilot-v2.2/analysis.json) |
| 每个 trial 的审核证据 | [`results/adaptive-pilot-v2.2/`](../../results/adaptive-pilot-v2.2/) |
| Evidence checksum | 每个 trial 目录内的 `SHA256SUMS` |
| 原始 transcript | 只保留在本地，不公开，因为可能包含本机路径与 Session metadata |

## 冻结版本提醒

v2.2 研究固定使用 `vertex-palace@0.2.1`。后续产品版本修复了研究发现的问题，
但不能把新版本行为倒填进旧 trial，也不能用新版本重跑后继续称为同一个 v2.2
数据集。任何修复后比较都必须使用新的协议版本、trial id、seed 与冻结 tag。

Control-first v3 正是这样的独立新协议。正式计划写入公开 commitment 并设为
`frozen:true` 后，依序完成 16 项 trial；结果先锁定，随后才公开私钥与分配。
新版 memory fixture 使用匿名 stratum 与私有 256-bit 密钥排列三个虚构 tenant，
公开源码、计划和提示词都不显示本轮 owner；所有 Arm 也已使用相同停止条件。详见
[隐藏分配设计](CONTROL_FIRST_V3_BLINDED_DESIGN.md)、[冻结证据](../research/evidence/control-first-v3-freeze-2026-07-21.json)
与[揭盲记录](../../results/control-first-v3/blinding-reveal.json)。揭盲能复现冻结 commitment
与全部四项分配。

当前产品工程闸门已经取得 Zod 与 Requests 目标召回率 1.000、严格精度 1.000，
并通过包含 50 条记忆候选的干净安装 context ceiling 测试。这些数据只证明固定的
路由与输出契约，不是 Adaptive 相对普通 Codex 的 Agent A/B 结果。

当前运行时源码固定到 `e901c1739c5aa907bc44ebcbd25bbdd7abd75e7a`，双语研究证据
固定到 `f2e0ccabb0f5a7af77a72b971524122469f47172`。历史路由评估由 3/8 进展到
固定 oracle 8/8，但真实九文件更新仍曾只有 7/9。最终 provenance 候选让当前九文件
源码／证据同步精确命中 9/9，coverage 与 focus 都为 1.00。产品自身 17 文件广域
改造则仍为默认 9/17、扩展路线 13/17；文档收尾也只有 3/5。通过与失败结果都保存在
[机器证据](../research/evidence/vertex-palace-0.3.0-sync-evaluation.json)，这些属于路由
工程证据，不代表端到端 Agent Token 或时间已经下降。

## 引用边界

引用本仓库时，请同时说明：这是单一 Windows 环境、单一 Codex/model build、四个
确定性合成仓库、每场景四组配对的探索性研究。不要只引用 payload 缩小而省略
Control，也不要把 transcript 出现的路径字符串称为“实际读取文件数”。
