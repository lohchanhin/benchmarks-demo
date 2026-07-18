# Vertex Palace Agent 基准实验

这是一个公开、预注册、可复现的 Codex Agent 工具实验，比较三种工作方式：

- **Control**：普通 Codex，不得读取或调用 Palace。
- **Route-only**：使用 `palace context` 路由，但没有历史记忆。
- **Full Palace**：路线、Context Pack、Pitfall Board 与历史记忆全部启用。

[English](README.md) | [研究协议](docs/research/PROTOCOL.md) | [测试方法](METHODOLOGY.md) | [影片指南](DEMO.md)

## 可证伪假设

- **H1**：Full Palace 的任务正确率不明显低于 Control。
- **H2**：双方都成功时，Palace 减少累计上下文与重复探索。
- **H3**：历史踩坑记录降低多客户项目重复事故率。
- **H4**：错误或过期记忆不会明显增加错误修改。
- **H5**：小型单文件任务中，Palace 可能只有额外成本。

这里没有预设 Palace 必须获胜。较慢、Token 更多、没有差异、被错误记忆
误导，全部都是必须保留的有效结果。新实验的指标、排除规则和统计方法已先在
`protocol-v1.0.0` tag 冻结。

## 一条流程复现实验

```sh
git clone https://github.com/lohchanhin/benchmarks-ab-demo.git
cd benchmarks-ab-demo
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

新的四场景实验正在运行，目前发布了计划 20 个 trial 中的 11 个，不能把中间值包装成统计结论。

| 数据集 | 正确性 | 效率结果 | 状态 |
| --- | --- | --- | --- |
| 四场景三臂实验 | 前十一个 trial 的 33/33 Arm 均通过公开测试和隐藏 Oracle | 小任务 Full 相对 Control 配对中位数：reported tokens 多 29,423、uncached input 少 130、调用多 6 次；跨层为 +23,648、+10,250、+11 次 | 小任务 5/5；跨层 5/5；租户记忆 1/5；整体 11/20 |
| 旧版 v0.1.6 三组配对 | 6/6 Arm 通过，范围分数 100/100 | Palace 三轮累计 Token 较低，两轮较快 | 先导实验 |
| 旧版 live-05 | 双方通过 | Palace 慢 105.4 秒且 Token 更多 | 公开负面案例 |

旧三轮的 Palace 非缓存输入中位数还高出 6,101 Token。完整数据在
[三组配对报告](docs/results/v0.1.6-three-pairs.md)，失败案例在
[live-05 复盘](docs/results/live-05.md)。

五个预注册负面对照的[trial 01](results/pilot/small-local-bug-pilot-01/comparison.md)、
[trial 02](results/pilot/small-local-bug-pilot-02/comparison.md)、
[trial 03](results/pilot/small-local-bug-pilot-03/comparison.md)、
[trial 04](results/pilot/small-local-bug-pilot-04/comparison.md)、
[trial 05](results/pilot/small-local-bug-pilot-05/comparison.md)和
[中间分析](results/pilot/analysis.md)已公开。Full Palace 的配对中位数多用 29,423 reported tokens
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
最终会另做三臂消融摘要。

第一个预注册租户记忆结果已公开为
[trial 01](results/pilot/tenant-memory-pitfall-pilot-01/comparison.md)。三个 Arm 都通过隐藏 Oracle，
changed-file precision/recall 均为 100%，且没有禁止文件违规，所以单组结果还不能证明历史记忆提高正确率。
Full Palace 相对 Control 少用 64,710 reported tokens，快 34.7 秒，但多用 9,583 uncached input tokens。
这些只是一组配对的描述值，不是 H3 证据。

**Vertex Palace 不保证每项任务都会更快或更省 Token。** 在线服务延迟变化很大，
墙钟时间只作为次要指标。

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
- Pilot 后执行 power analysis，再冻结新的 confirmatory protocol。

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
npm run benchmark -- study --plan results/pilot/plan.json
```

`npm run check` 会验证 harness，并对四个 fixture 证明：原始版本必须同时被公开
测试和隐藏 Oracle 判定失败，标准最小修复则必须全部通过。

原始 JSONL 默认保存在 `.benchmark-runs/`，因为可能包含本机路径与 Session
metadata。公开前发布审核过的 evidence 与报告，但 `results/manifest.json` 不能删除
不利、失败、无效或超时的尝试。
