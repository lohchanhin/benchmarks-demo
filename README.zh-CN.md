# Vertex Palace Agent 基准实验

这是一个公开、预注册、可复现的 Codex Agent 工具实验。已完成的 v1 比较三种工作方式，预注册的 v2 再加入第四种：

- **Control**：普通 Codex，不得读取或调用 Palace。
- **Route-only**：使用 `palace context` 路由，但没有历史记忆。
- **Full Palace**：路线、Context Pack、Pitfall Board 与历史记忆全部启用。
- **Adaptive Palace（v2）**：协议设计为与 Full 使用相同记忆，但只调用一次 `palace context --auto`，由工具选择最小安全模式；v0.2.1 的实际记忆一致性也被本研究检验。

[English](README.md) | [验证覆盖矩阵](docs/zh-CN/VALIDATION_COVERAGE_MATRIX.md) | [0.3.0 发布前候选验证](docs/zh-CN/CONTROL_FIRST_V3_CANDIDATE_VALIDATION.md) | [中文辅助文档](docs/zh-CN/README.md) | [快速验证指南](docs/zh-CN/QUICKSTART.md) | [结果阅读指南](docs/zh-CN/RESULTS_GUIDE.md) | [Control-first v3 中文协议](docs/zh-CN/PROTOCOL_V3.md) | [v2.2 最终报告](docs/research/ADAPTIVE_V2_2_FINAL.md) | [v1 研究协议](docs/research/PROTOCOL.md) | [Adaptive v2.2 协议](docs/research/PROTOCOL_V2_2.md) | [协议修订](docs/research/PROTOCOL_AMENDMENTS.md) | [测试方法](METHODOLOGY.md) | [影片指南](DEMO.md)

## 第一次来这里

| 你的目标 | 建议入口 |
| --- | --- |
| 先看客观结论 | [结果阅读指南](docs/zh-CN/RESULTS_GUIDE.md) |
| 区分已证明、工程预跑与尚未证明 | [验证覆盖矩阵](docs/zh-CN/VALIDATION_COVERAGE_MATRIX.md) |
| 不调用 Agent，只验证代码、计划与公开证据 | [快速验证指南](docs/zh-CN/QUICKSTART.md#快速验证不执行-agent) |
| 了解完整实验设计 | [测试方法](METHODOLOGY.md)与[冻结 v2.2 协议](docs/research/PROTOCOL_V2_2.md) |
| 审核最终数字与限制 | [Adaptive v2.2 最终报告](docs/research/ADAPTIVE_V2_2_FINAL.md) |
| 查看修复后但尚未执行的 Control-first 设计 | [v3 中文协议](docs/zh-CN/PROTOCOL_V3.md) |
| 准备三分钟比赛影片 | [快速验证指南的影片段落](docs/zh-CN/QUICKSTART.md#三分钟影片辅助流程)与[英文影片指南](DEMO.md) |

中文文档是阅读与复现辅助，不会改写英文冻结协议、原始 JSON、checksum 或
已发表结果。完整 v2.2 会启动 64 个 Codex Agent Arm；一般评审应先运行不执行
Agent 的快速验证，不要把整套研究当成普通单元测试直接重跑。

## 可证伪假设

- **H1**：Full Palace 的任务正确率不明显低于 Control。
- **H2**：双方都成功时，Palace 减少累计上下文与重复探索。
- **H3**：历史踩坑记录降低多客户项目重复事故率。
- **H4**：错误或过期记忆不会明显增加错误修改。
- **H5**：小型单文件任务中，Palace 可能只有额外成本。

这里没有预设 Palace 必须获胜。较慢、Token 更多、没有差异、被错误记忆
误导，全部都是必须保留的有效结果。新实验的指标、排除规则和统计方法已先在
`protocol-v1.0.0` tag 冻结。

## Adaptive v2.2 后继研究

v1 的 Full Palace 没有观察到端到端效率优势，所以 v2 不是改写旧结论，而是测试新的 Adaptive treatment。第一个冻结的 v2.0 trial 在结果已被查看后，才发现 PowerShell 把 Palace 三个 Arm 的 `$0.00` 改成了 `.00`。这次尝试完整保留为[公开但不可比较的结果](results/adaptive-pilot/small-local-bug-adaptive-pilot-01/comparison.md)：Control 单独有效，三个 Palace Arm 都没有通过任务文字一致性检查，`comparable` 为 `false`，所有效率差值为 `null`。

修正后的 [v2.1 协议](docs/research/PROTOCOL_V2_1.md)与[全新冻结计划](results/adaptive-pilot-v2.1/plan.json)锁定 Vertex Palace 0.2.1，使用新的 trial id、seed、安全的 PowerShell 任务传递，以及 Palace 输出 `## Task` 与 manifest 的精确比对。

设计包含 4 个场景 x 4 个 seed x 4 个 Arm，共 64 个全新 Session。每个场景使用完整的四臂 Williams 顺序，让每个 Arm 在第一、第二、第三、第四位置各出现一次；两组使用 warm 本地索引，两组在计时前移除索引并强制重建。Cache 分配会跨场景轮换，使每条 Williams 顺序在完整 Pilot 中恰好出现两次 warm、两次 cold。这个控制不包含服务端模型缓存，墙钟时间仍是次要指标。

v2.1 主比较是 Adaptive 相对 Full Palace 的正确性；只有双方都有效且正确完成，才比较 Palace payload、Codex Token、工具调用和时间。第一组 v2.1 四个 Arm 均有效且正确；Adaptive 相对 Full 的 payload 少 868 bytes、调用少 9 次、reported tokens 少 135,969，但慢 4.1 秒且 uncached input 多 2,392。这只是单组 interim 结果，不是普遍效率结论。完整[结果与基础设施噪声说明](results/adaptive-pilot-v2.1/README.md)已公开；因为发现 Windows split writable roots 导致四臂都发生 `apply_patch` 失败，剩余 v2.1 计划停止执行，不会悄悄续跑。

新的 [v2.2 协议](docs/research/PROTOCOL_V2_2.md)与[冻结计划](results/adaptive-pilot-v2.2/plan.json)使用全新的 trial id 与 seed，并额外冻结 `win32`、`workspace-write/windows-elevated`，以及“先写在 Arm 工作区、Codex 结束后再搬到 artifacts”的 last-message 传递方式。任何 sandbox preparation 错误都会让对应 Arm 基础设施无效。冻结前另做了一次不计入研究结果的完整闸门测试：仓库内固定的 Palace、原生 `apply_patch`、公开测试与隐藏 Oracle 全部通过，router error 为 0。脱敏的[诊断过程与失败假设](docs/research/HARNESS_DIAGNOSTICS.md)已公开；冻结时 v2.2 仍是 0 个正式结果。

远端标签推送后，small-local 场景四组正式 trial 已全部完成，16 个 Arm 全部有效、范围正确，并通过公开测试与隐藏 Oracle；sandbox preparation error 全是 0。Adaptive 四组都选择 `route-lite`。Adaptive 减 Full 的配对中位差是 -19,935 reported tokens、+887 uncached input tokens、-4.5 次工具调用与 -7.448 秒。完整的[场景区块报告](docs/research/SMALL_LOCAL_V2_2_BLOCK.md)也同时呈现 Adaptive 相对 Control 的额外成本，不能把这组结果当成普遍效率优势。

随后完成的 cross-stack 四组 trial 把进度推进到 8/16。十六个 Arm 都找到 client/server 两个必要修改并通过所有有效性检查。Adaptive 四次都选择 `full-palace`；相对 Full 的配对中位差是 -929 Palace bytes、-2,083 uncached input tokens、-2 次工具调用与 -16.483 秒，但 reported tokens 是 +25,709.5。除了 Palace payload 缩小外，其余区间都跨越 0；完整的[场景区块报告](docs/research/CROSS_STACK_V2_2_BLOCK.md)也显示 Adaptive 相对 Control 仍较慢、调用更多。

useful-memory 四组 trial 全部完成后，整体进度为 12/16。十六个 Arm 都避开被禁止的 shared-theme 修改并通过所有检查，因此这个任务没有显示记忆带来的正确性优势。四组 Full context 都包含两条 Aurora 踩坑告示，Adaptive 虽四次选择 `full-palace`，却每次都显示 memory item 与 guardrail 为 0，并遗漏两条告示。完整的[场景区块报告](docs/research/USEFUL_MEMORY_V2_2_BLOCK.md)与[treatment 发现](docs/research/ADAPTIVE_MEMORY_OMISSION.md)会保留为 v0.2.1 的真实行为；v2.2 没有在中途修改。

stale-memory 对抗场景四组 trial 全部完成后，整体进度达到 16/16。Adaptive 四次选择 `guarded-memory-palace`，送入两条过期 v1 记录，并加入两条明确 guardrail，要求以当前代码与测试为准。十六个 Arm 都拒绝错误旧建议并通过检查，因此正确性仍相同。四组 Adaptive 减 Full 的配对中位差为 -16,381 reported tokens、+458 uncached input tokens、+4 次工具调用与 -6.377 秒，而 Palace payload 小 233 bytes。完整[场景区块报告](docs/research/STALE_MEMORY_V2_2_BLOCK.md)与四份脱敏机制证据均已公开。

完整研究共有 64/64 个有效、成功且范围正确的 Arm。Adaptive 相对 Full 的整体中位差为 -898.5 Palace bytes、-16,522.5 reported tokens、-2.5 次工具调用与 -6.553 秒，但只有 Palace payload 的区间没有跨越 0。相对 Control，Adaptive 的中位差为 +30,147 reported tokens、+4.5 次工具调用与 +10.919 秒，其中工具调用区间完全高于 0。[最终报告](docs/research/ADAPTIVE_V2_2_FINAL.md)的客观结论是：路由与防护上下文有价值，但尚未证明普遍省 Token 或更快。

## Control-first v3 设计审核

npm 发布前另设一轮独立的[16 项非正式候选验证](docs/zh-CN/CONTROL_FIRST_V3_CANDIDATE_VALIDATION.md)，
使用精确的 0.3.0 tarball，但不改变正式 v3 的 0/16 基线。预注册计划、私密分配键
commitment、包哈希、脱敏结果与失败记录都会公开审计。

下一轮独立协议把主比较改为 Adaptive Palace 对普通 Codex，主要效率指标固定为
配对累计 `reportedTokens`，但仍先判断正确性与严格修改范围。新
`decision-memory-dependent` 情境在 baseline 会通过公开测试，却会被 hidden
oracle 拒绝。Aurora、Borealis 与 Cedar 只是三个虚构租户；正式 trial 的 owner 会由
未公开的 256-bit 密钥置换，只有相应历史决策才能指出该次 trial 的正确租户。

[英文 v3 协议草案](docs/research/PROTOCOL_V3.md)、[简体中文辅助说明](docs/zh-CN/PROTOCOL_V3.md)、
[16-trial 草案计划](results/control-first-v3/plan.json)与[空结果 manifest](results/control-first-v3/manifest.json)
已经公开。目前计划仍是 `frozen:false`、0 个 Agent 结果，不能执行。产品 0.3.0、
clean install、记忆 smoke 与完整 benchmark 闸门通过后，才会冻结并打协议 tag。

计划 schema 6 同时固定实现提交 `e901c1739c5aa907bc44ebcbd25bbdd7abd75e7a`、
发布提交 `f2e0ccabb0f5a7af77a72b971524122469f47172`、候选 tarball SHA-1
`04602918f8e661a57c8286fb7b6d344baf9fb3aa` 与完整 npm integrity。正式执行前会
核对 `package-lock.json` 和实际安装版本，不能只靠相同的包名与版本号混过去。

[v3 preflight 研发记录](docs/research/CONTROL_FIRST_V3_PREFLIGHT.md)保留了三次
memory smoke 的失败与修复、产品 commit、CI 证据和剩余闸门，不会把工程 smoke
包装成正式 Agent 结果。

[两组 Agent 预跑说明](docs/zh-CN/CONTROL_FIRST_V3_AGENT_PREFLIGHT.md)进一步保留了
177 bytes bypass 仍比 Control 慢且 Token 更多的负面结果，以及一组 Route-only 失败、
Control 与 Adaptive 都成功的记忆任务。它们只是修订正式设计的依据，不在 v3 manifest 内。

[发布来源闸门](docs/zh-CN/CONTROL_FIRST_V3_RELEASE_PROVENANCE.md)固定候选 tarball，
并如实记录第一次 npm 浏览器授权过期；不会把未完成发布写成成功。
执行 `npm run gate:control-first:v3` 会得到机器可读的 19 项冻结前检查；
`npm run check:release-ready` 会先跑完整 benchmark check。只要公开 registry、
`package.json`、`package-lock.json` 与实际安装包还没有共同指向同一份 0.3.0，命令就会
刻意失败，同时继续确认 v3 manifest 没有正式结果。
上述检查通过后，`npm run freeze:control-first:v3` 会从
`VERTEX_PALACE_BENCHMARK_VARIANT_KEY` 读取私钥并默认只做 dry run；审阅公开 commitment
后才追加 `-- --write`。私钥不会输出、写文件或传给子进程。第一次正式执行必须从
干净且精确标记 `protocol-v3.0.0` 的 HEAD 开始；中断续跑只允许结果文件发生变化。

```sh
npm ci
npm run benchmark -- study --plan results/adaptive-pilot-v2.2/plan.json
# 确认版本与环境后才执行：
npm run benchmark -- study --plan results/adaptive-pilot-v2.2/plan.json --execute
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
npm run benchmark -- study --plan results/adaptive-pilot-v2.2/plan.json
```

`npm run check` 会验证 harness，并对四个 fixture 证明：原始版本必须同时被公开
测试和隐藏 Oracle 判定失败，标准最小修复则必须全部通过。

原始 JSONL 默认保存在 `.benchmark-runs/`，因为可能包含本机路径与 Session
metadata。公开前发布审核过的 evidence 与报告，但 `results/manifest.json` 不能删除
不利、失败、无效或超时的尝试。
