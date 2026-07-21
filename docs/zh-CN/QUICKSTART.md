# 简体中文快速验证指南

本指南把“检查公开证据”和“重新运行 Agent 实验”分开。绝大多数评审只需要
前者；完整 v2.2 包含 64 个 Codex Agent Arm，会消耗明显的时间与模型资源。

[中文文档索引](./README.md) | [结果阅读指南](./RESULTS_GUIDE.md) | [项目中文首页](../../README.zh-CN.md)

## 第四代准备状态（不执行 Agent）

第四代目前只允许生成候选计划与检查冻结闸门：

```powershell
npm run v4:plan
npm run v4:gate
npm run check:v4-prep
```

审核前 draft 保持 `frozen: false`；所有者授权后的 frozen plan 为
`frozen: true`、`executionAllowed: true`，但正式 trial 仍为 0。代码中没有
`v4-run`，因此本阶段不能启动第四代正式 Agent 测试。完整设计见
[第四代真实仓库候选协议](./PROTOCOL_V4_CANDIDATE.md)。

## 环境要求

- Node.js 20 或 22
- Git
- 能访问 npm registry
- 只有执行 Agent trial 时，才需要已认证且版本匹配的 Codex CLI

研究依赖中的 `vertex-palace@0.2.1` 是冻结 treatment，不是忘记升级。不要为了
“使用最新版”而修改 lockfile，否则运行的就不再是已发表 v2.2 条件。

## 快速验证：不执行 Agent

下面的流程会安装锁定依赖、运行 harness 单元测试、验证五个 fixture、审核已
发布结果与 checksum，并检查 v2.2 冻结计划；不会启动 Codex Agent：

```bash
git clone https://github.com/lohchanhin/benchmarks-ab-demo.git
cd benchmarks-ab-demo
npm ci
npm run check
npm run benchmark -- study --plan results/adaptive-pilot-v2.2/plan.json
```

最后一条命令没有 `--execute`，只验证计划。它应显示计划有效，并提示必须明确
加入 `--execute` 才会开始或继续实验。

可以单独审核 v2.2 evidence：

```bash
npm run audit:adaptive:v2.2
npm run audit:control-first:v3
```

审核器会检查 manifest、每个 trial 的文件集合与 `SHA256SUMS`。公开 evidence
经过脱敏；raw transcript 不在 Git 中，因为它可能包含本机路径与 Session
metadata。

`audit:control-first:v3` 现在应显示 `16/16`、64 个有效 Arm、58 个成功 Arm 与
128 份 checksum 验证通过的公开文件。v3 已从精确 `protocol-v3.0.0` tag 顺序执行，
全部结果先锁定，私密分配键才随后公开。可独立复算揭盲：

```bash
npm run verify:reveal:control-first:v3
npm run analysis:control-first:v3
```

## 重新生成聚合分析

验证脚本使用固定 bootstrap seed，在内存中从已发布 manifest 重建分析，并与
发表的 JSON 和 Markdown 做结构化比较：

```bash
npm run verify:analysis:adaptive
```

验证器只忽略每次生成必然不同的顶层 `generatedAt` 时间；其余 JSON 结构、数值
与完整 Markdown 必须完全相同。这样不会修改已发表 artifact，也不会用“时间戳
不同”掩盖真实统计差异。若验证失败，应先检查 Node 版本、Git 状态和输入
manifest，不要直接覆盖发表文件。

## 查看一个已完成 trial

不必运行 Agent，也能检查四个 Arm 的同任务、同 fixture 与结果：

```text
results/adaptive-pilot-v2.2/
  cross-stack-regression-adaptive-v2-2-pilot-01/
    run-plan.json
    control-evidence.json
    route-only-evidence.json
    full-palace-evidence.json
    adaptive-palace-evidence.json
    comparison.json
    comparison.md
    SHA256SUMS
```

建议先看 `comparison.md`，再用 `comparison.json` 核对机器可读值，最后查看
`SHA256SUMS`。不要从单一最快 trial 推广性能结论；最终分析使用同 trial 内的
配对差值，并同时报告所有场景。

## 完整 Agent 复现：高成本

只有在需要复现实验执行本身，而且能够匹配冻结环境时才进行。先切到结果产生前
冻结的 tag：

```bash
git checkout protocol-v2.2.0
npm ci
npm run benchmark -- doctor
npm run benchmark -- study --plan results/adaptive-pilot-v2.2/plan.json
```

确认 Codex CLI、model、reasoning effort、Vertex Palace、Windows sandbox 与
last-message transport 都符合计划后，可以只执行一组 trial：

```bash
npm run benchmark -- study \
  --plan results/adaptive-pilot-v2.2/plan.json \
  --execute \
  --limit 1
```

不要在 `main` 上用最新版 Palace 重跑后混入旧 manifest。任何环境不一致、任务
文字不一致、sandbox preparation error 或 treatment violation 都必须保留并标记
无效，不能因为代码最后通过测试就算作有效研究结果。

Windows Store alias 无法从子进程启动时，显式传入真实 CLI：

```powershell
npm run benchmark -- study `
  --plan results/adaptive-pilot-v2.2/plan.json `
  --execute `
  --limit 1 `
  --codex-bin "$env:CODEX_CLI_PATH"
```

## 常见误读

- `Palace output bytes` 只量测 Palace 送出的 payload，不等于 Codex 总 Token。
- `reported tokens` 是 transcript 累计计数，不是账单金额。
- 路径字符串是 transcript proxy，不是操作系统文件读取审计。
- 配对区间跨越 0 不代表“证明完全没差异”，而是当前样本没有建立稳定方向。
- 64/64 正确代表这些 fixture 内没有观察到正确性差异，不代表所有真实仓库都相同。

## 三分钟影片辅助流程

完整脚本见[英文影片指南](../../DEMO.md)。建议影片按以下顺序：

1. 先说明四个 Arm 与同任务、同 Git tree、隐藏 Oracle。
2. 播放预先录制的 Control 与 Palace 执行片段，不让观众等待模型运行。
3. 先展示公开测试、隐藏 Oracle、禁止文件与 changed files，再谈效率。
4. 同屏展示 Adaptive 对 Full 与 Adaptive 对 Control，不能只放有利基线。
5. 明确说出结论：payload 稳定缩小，但普遍 Token 与速度优势尚未建立。
6. 最后展示公开仓库、MIT License、冻结 tag 与上面的无 Agent 验证命令。

发布影片前必须移除私有路径、Session ID、邮箱、token 与未经审核的 transcript。
