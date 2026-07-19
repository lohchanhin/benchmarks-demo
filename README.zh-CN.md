# Vertex Palace Agent 基准实验

这是一个公开、预注册、可复现的 Codex Agent 工具实验。已完成的 v1 比较三种工作方式，预注册的 v2 再加入第四种：

- **Control**：普通 Codex，不得读取或调用 Palace。
- **Route-only**：使用 `palace context` 路由，但没有历史记忆。
- **Full Palace**：路线、Context Pack、Pitfall Board 与历史记忆全部启用。
- **Adaptive Palace（v2）**：与 Full 使用相同记忆，但只调用一次 `palace context --auto`，由工具选择最小安全模式。

[English](README.md) | [v1 研究协议](docs/research/PROTOCOL.md) | [Adaptive v2 协议](docs/research/PROTOCOL_V2.md) | [测试方法](METHODOLOGY.md) | [影片指南](DEMO.md)

## 可证伪假设

- **H1**：Full Palace 的任务正确率不明显低于 Control。
- **H2**：双方都成功时，Palace 减少累计上下文与重复探索。
- **H3**：历史踩坑记录降低多客户项目重复事故率。
- **H4**：错误或过期记忆不会明显增加错误修改。
- **H5**：小型单文件任务中，Palace 可能只有额外成本。

这里没有预设 Palace 必须获胜。较慢、Token 更多、没有差异、被错误记忆
误导，全部都是必须保留的有效结果。新实验的指标、排除规则和统计方法已先在
`protocol-v1.0.0` tag 冻结。

## Adaptive v2 研究

v1 的 Full Palace 没有观察到端到端效率优势，所以 v2 不是改写旧结论，而是测试新的 Adaptive treatment。v2 的[协议](docs/research/PROTOCOL_V2.md)与[冻结计划](results/adaptive-pilot/plan.json)会在新结果产生前提交。

设计包含 4 个场景 x 4 个 seed x 4 个 Arm，共 64 个全新 Session。每个场景使用完整的四臂 Williams 顺序，让每个 Arm 在第一、第二、第三、第四位置各出现一次；两组使用 warm 本地索引，两组在计时前移除索引并强制重建。Cache 分配会跨场景轮换，使每条 Williams 顺序在完整 Pilot 中恰好出现两次 warm、两次 cold。这个控制不包含服务端模型缓存，墙钟时间仍是次要指标。

v2 主比较是 Adaptive 相对 Full Palace 的正确性；只有双方都正确完成，才比较 Palace payload、Codex Token、工具调用和时间。目前 v2 是**已预注册、尚未完成**，不能从计划本身推断结果。

```sh
npm ci
npm run benchmark -- study --plan results/adaptive-pilot/plan.json
# 确认版本与环境后才执行：
npm run benchmark -- study --plan results/adaptive-pilot/plan.json --execute
npm run analysis:adaptive
```

## 一条流程复现实验

```sh
git clone https://github.com/lohchanhin/benchmarks-ab-demo.git
cd benchmarks-ab-demo
git checkout pilot-v1-complete
npm ci
npm run benchmark -- doctor
npm run benchmark -- study --plan results/pilot/plan.json --execute
npm run analysis:pilot
```

冻结计划包含 4 个场景 x 5 个随机 seed x 3 个 Arm，共 60 个全新的
ephemeral Codex Session。`study` 支持断点续跑，并会在每次尝试后登记成功、
失败、超时或无效证据。正式 Pilot 固定使用 `codex-cli 0.145.0-alpha.18`、
`gpt-5.6-sol`、xhigh reasoning 与 `vertex-palace@0.1.6`；只想展示一组时可追加
`--limit 1`。

## 正确性优先

预注册四场景实验已经完成：20/20 个 trial、60/60 个全新 Arm 均已公开。它仍是样本不足的探索性 Pilot，不是确认性产品性能结论。

| 数据集 | 正确性 | 效率结果 | 状态 |
| --- | --- | --- | --- |
| 四场景三臂实验 | 20/20 trial 的 60/60 Arm 均通过公开测试和隐藏 Oracle | 整体 Full 相对 Control 配对中位数：reported tokens +67,223.5、uncached input +6,127.5、调用 +8.5、墙钟 +29.8 秒 | 探索性 Pilot 完成；没有观察到效率胜利 |
| 旧版 v0.1.6 三组配对 | 6/6 Arm 通过，范围分数 100/100 | Palace 三轮累计 Token 较低，两轮较快 | 先导实验 |
| 旧版 live-05 | 双方通过 | Palace 慢 105.4 秒且 Token 更多 | 公开负面案例 |

[完整配对分析](results/pilot/analysis.md)与[功效敏感度分析](results/pilot/power-analysis.md)给出的边界结论是：

- **H1：** 三臂在全部 trial 都成功，未观察到正确性损失；每场景只有五组配对，不能建立预注册的非劣效结论。
- **H2：** 本 Pilot 不支持。整体 Full 减 Control 为 +67,223.5 reported tokens（95% bootstrap CI +25,362.5 到 +112,437.5）、+6,127.5 uncached input（CI +2,390 到 +10,636.5）、+8.5 次调用（CI +6 到 +16）与 +29.8 秒（CI +16.4 到 +49.2）。
- **H3：** 不支持，因为 Control 与 Route-only 也避开了所有租户坑点，fixture 没让历史记忆成为必要条件。
- **H4：** 作为安全机制有描述性支持：Full 在 5/5 trial 都拒绝过期 v1 建议，但样本不足以推广。
- **H5：** 小任务负面对照观察到预期的 Palace 固定调用成本。

旧三轮的 Palace 非缓存输入中位数还高出 6,101 Token。完整数据在
[三组配对报告](docs/results/v0.1.6-three-pairs.md)，失败案例在
[live-05 复盘](docs/results/live-05.md)。

五个预注册负面对照的[trial 01](results/pilot/small-local-bug-pilot-01/comparison.md)、
[trial 02](results/pilot/small-local-bug-pilot-02/comparison.md)、
[trial 03](results/pilot/small-local-bug-pilot-03/comparison.md)、
[trial 04](results/pilot/small-local-bug-pilot-04/comparison.md)、
[trial 05](results/pilot/small-local-bug-pilot-05/comparison.md)和
[完整分析](results/pilot/analysis.md)已公开。Full Palace 的配对中位数多用 29,423 reported tokens
和 6 次工具调用；reported tokens 的 95% bootstrap CI 为 -2,445 到 113,838，
uncached input 差值为 -130（CI -24,212 到 11,814），墙钟结果从快 25.5 秒到慢 62.0 秒。
这个完整负面对照区块描述性支持“小任务有固定调用成本”，但不是普遍性能结论。

五个预注册跨层结果已全部公开：[trial 01](results/pilot/cross-stack-regression-pilot-01/comparison.md)、
[trial 02](results/pilot/cross-stack-regression-pilot-02/comparison.md)与
[trial 03](results/pilot/cross-stack-regression-pilot-03/comparison.md)与
[trial 04](results/pilot/cross-stack-regression-pilot-04/comparison.md)与
[trial 05](results/pilot/cross-stack-regression-pilot-05/comparison.md)。15 个 arm 都找到两个必要修改并通过隐藏
Oracle；五组 Palace 路线都命中全部四个 ground truth 文件（Recall@K 100%、Precision@K 80%）。
五组 Full Palace 减 Control 的配对中位差为：reported tokens +23,648（95% bootstrap CI -43,041 到
+85,854）、uncached input +10,250（CI -5,575 到 +21,513）、工具调用 +11（CI +7 到 +17）、
墙钟 +20.5 秒（CI -7.5 到 +37.5）。reported tokens 的分组中位数却是 Control 245,300、Full
240,938，方向与配对差值相反；这个实验设计应以配对差值为主要摘要。transcript 路径字符串在 trial 01 从 87 降到 6，
但 trial 02 是 87 对 86，证明这个受 inventory 命令影响的 proxy 不能当成文件读取审计。
这个五组场景已经完成，但仍是探索性 pilot，不是普遍性能结论。每个 comparison 都保留 Route-only 原始指标，
最终分析也包含两个次要三臂消融对比。

五个预注册租户记忆结果已全部公开为
[trial 01](results/pilot/tenant-memory-pitfall-pilot-01/comparison.md) 与
[trial 02](results/pilot/tenant-memory-pitfall-pilot-02/comparison.md) 与
[trial 03](results/pilot/tenant-memory-pitfall-pilot-03/comparison.md) 与
[trial 04](results/pilot/tenant-memory-pitfall-pilot-04/comparison.md) 与
[trial 05](results/pilot/tenant-memory-pitfall-pilot-05/comparison.md)。十五个 Arm 都通过隐藏 Oracle，
changed-file precision/recall 均为 100%，且没有禁止文件违规。Control 从未重复种子坑点，
所以这个完成区块没观察到 memory 的正确性增益，不支持 H3。
Full Palace 减 Control 的配对中位差为：reported tokens +173,308（95% bootstrap CI -64,710 到 +225,172）、
uncached input +5,279（CI -15,277 到 +11,023）、工具调用 +20（CI -1 到 +24）、
墙钟 +68.5 秒（CI -34.7 到 +84.4）。这个探索性结果表明 fixture 可能不够敏感，
无法让历史记忆成为必要条件，但 Full treatment 仍带来了行为成本。

五个预注册过期记忆结果已全部公开为
[trial 01](results/pilot/stale-memory-adversarial-pilot-01/comparison.md) 与
[trial 02](results/pilot/stale-memory-adversarial-pilot-02/comparison.md) 与
[trial 03](results/pilot/stale-memory-adversarial-pilot-03/comparison.md) 与
[trial 04](results/pilot/stale-memory-adversarial-pilot-04/comparison.md) 与
[trial 05](results/pilot/stale-memory-adversarial-pilot-05/comparison.md)。十五个 Arm 都只修改 v2 scheduler loader
并通过隐藏 Oracle；Full Palace 在五组都没有采用过期 v1 记忆。Full Palace 减 Control
的配对中位差为 +71,864 reported tokens（95% bootstrap CI +5,069 到 +179,047）、
+6,620 uncached input（CI +1,310 到 +17,988）、+9 次调用（CI +3 到 +19）与
+35.0 秒（CI +20.2 到 +49.9）。这是伴随明确效率成本的 H4 描述性安全证据。

**Vertex Palace 不保证每项任务都会更快或更省 Token。** 在线服务延迟变化很大，
墙钟时间只作为次要指标。

## 三臂消融

整体 20 组中，Route-only 减 Control 的配对中位差为 +26,059.5 reported tokens
（CI -2,050.5 到 +54,179.5）、+2,798 uncached input（CI -1,871 到 +13,319）、
+11 次调用（CI +5 到 +14）与 +16.5 秒（CI -2.5 到 +30.5）。Full 减 Route-only
为 +36,610.5 reported tokens（CI -13,234.5 到 +66,251.5）、+2,950 uncached input
（CI -6,169.5 到 +11,489）、+0.5 次调用（CI -3 到 +5.5）与 +16.6 秒
（CI -5.2 到 +28.9）。各场景原始值与区间见[三臂消融表](results/pilot/analysis.md#three-arm-ablation)。

## 四个预注册场景

| 场景 | 验证内容 |
| --- | --- |
| `small-local-bug` | 单文件负面对照，测量 Palace 固定成本 |
| `cross-stack-regression` | 前后端契约与间接依赖完整度 |
| `tenant-memory-pitfall` | 多客户共享样式事故与有用记忆 |
| `stale-memory-adversarial` | v1 旧记忆与 v2 当前架构冲突时的抗误导能力 |

每个 Agent workspace 只能看到任务和公开测试。外部隐藏 Oracle、预期修改文件、
禁止修改文件、路由 ground truth 与评分逻辑都留在 benchmark 仓库，不会复制给
Agent。

## 成功条件

固定 600 秒内同时满足以下条件才算成功：

- Arm 使用方式有效；
- Codex 正常结束且没有超时；
- 完整公开测试通过；
- 外部隐藏 Oracle 通过；
- 没有修改禁止文件。

其次才比较 changed-file precision/recall、Route Recall@K/Precision@K、重复踩坑、
错误记忆采纳率、工具调用、失败调用、router errors、命令输出量，以及缓存、
非缓存、输入与输出 Token。

只有配对双方都成功时才比较效率，避免奖励“答错但很快”。Transcript 出现的路径
只是上下文代理指标，不能称为实际读取过的文件。

## 统计方法

- 二元成功率：配对差值、精确 McNemar 检验、bootstrap 95% 信赖区间。
- 连续指标：全部原始值、各组中位数、配对差值中位数、bootstrap 95% CI。
- 多场景比较：Holm 校正。
- 五组配对只标记为 exploratory pilot。
- Pilot 后执行[功效敏感度分析](results/pilot/power-analysis.md)，再冻结新的 confirmatory protocol。

由于主终点没有任何 discordant pair，不能从观察值估出有限样本量。透明的 20% discordance
敏感度锚点约需每场景 124 组配对，且尚未加入流失或多重比较修正。看过结果后新增的分析输出已在
[协议修订记录](docs/research/PROTOCOL_AMENDMENTS.md)公开。

## 单次 Trial

```sh
npm run benchmark -- prepare \
  --scenario cross-stack-regression \
  --run-id demo-01 \
  --seed reproducible-demo-seed

npm run benchmark -- run \
  --run-dir .benchmark-runs/demo-01 \
  --arm all \
  --order seeded

npm run benchmark -- report --run-dir .benchmark-runs/demo-01
```

## 开发验证

```sh
npm run check
npm run benchmark -- study --plan results/adaptive-pilot/plan.json
```

`npm run check` 会验证 harness，并对四个 fixture 证明：原始版本必须同时被公开
测试和隐藏 Oracle 判定失败，标准最小修复则必须全部通过。

原始 JSONL 默认保存在 `.benchmark-runs/`，因为可能包含本机路径与 Session
metadata。公开前发布审核过的 evidence 与报告，但 `results/manifest.json` 不能删除
不利、失败、无效或超时的尝试。
