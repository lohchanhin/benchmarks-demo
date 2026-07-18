# Vertex Palace A/B 基准测试

这是一个公开、可复现的 A/B 基准，用来比较 Codex 在**未使用**与**使用
Vertex Palace**时处理同一项仓库任务的实际差异。

[English](README.md) | [测试方法](METHODOLOGY.md) | [影片指南](DEMO.md)

## 已验证的真实配对

可复现的 GPT-5.6-sol 配对结果位于
[docs/results/live-05.md](docs/results/live-05.md)。两组都通过完整测试并取得
100/100 修改范围分数；Palace 把 transcript 中出现的仓库路径从 240 个缩小到
13 个，但运行更慢，Codex 回报的 Token 也更多。这是一组诚实的混合结果，
不是对所有项目的普遍结论。

## 为什么要做

“减少 Token”或“更快找到代码”很容易变成无法验证的宣传。本项目从同一个
Git tree 生成两个一次性工作区，给两个 Codex 会话相同的工程任务，并保存：

- Codex JSONL 运行记录
- Git 修改范围
- 完整测试结果
- 时间、工具调用、命令中明确点名的文件与 Codex 回报的 Token 数据
- Control 组没有调用 Palace、Palace 组确实调用 Palace 的有效性检查

Control 组使用普通仓库探索；Palace 组先执行状态、路线、Context Pack，并在
入口读取一次真实的历史踩坑。两组都必须通过完全相同的测试。

## 内建场景

`tenant-theme-regression` 会生成一个不需要安装依赖的 240 文件多租户 JavaScript
项目。任务有两个独立根因：

1. Aurora 租户颜色对比度不足。
2. 渲染器没有采用租户明确设置的文字颜色。

修改共享主题或削弱测试都会被判定为越界。Palace 组还会看到之前的事故记录：
曾经有人为了修 Aurora 修改共享主题，结果同时改变了其他客户。

## 快速开始

```sh
git clone https://github.com/lohchanhin/benchmarks-ab-demo.git
cd benchmarks-ab-demo
npm ci
npm run benchmark -- doctor
npm run benchmark -- prepare --run-id demo-01
npm run benchmark -- run --run-dir .benchmark-runs/demo-01 --arm both --model gpt-5.6-sol
npm run benchmark -- report --run-dir .benchmark-runs/demo-01
```

比赛页面称模型为 GPT-5.6；当前 ChatGPT 账号使用 Codex CLI 时，对应的命令行
标识是 `gpt-5.6-sol`。直接传入 `gpt-5.6` 会得到 unsupported-model 错误。

Windows 如果无法从子进程启动 Microsoft Store 的 `codex.exe` 别名，可以传入
真实路径：

```powershell
npm run benchmark -- run --run-dir .benchmark-runs/demo-01 --arm both --codex-bin "$env:CODEX_CLI_PATH"
```

## 公平性规则

- 两组使用同一个 Git tree、任务、模型与推理设置。
- 两组必须从全新会话开始。
- Control 组不得调用 `palace_*`、`palace` CLI 或读取 `.palace`。
- Palace 组至少要有一次可验证的 Palace 调用。
- 两组运行相同测试，不允许为了让 Control 失败而限制普通搜索工具。
- 正确性与修改范围决定分数；速度和 Token 只报告，不计入分数。

## 分数

- 60 分：完整测试通过
- 20 分：两个真正根因文件都被修改
- 20 分：没有修改共享主题、测试或其他无关文件，并通过 `git diff --check`

报告不会强行宣布赢家。模式不合规、测试失败或起始 Git tree 不一致的结果，会被
标示为无效或得到较低分数。

## 输出

每次运行会生成：

- `manifest.json`：起始 Git tree、任务和环境资料
- `artifacts/*-transcript.jsonl`：Codex 原始事件
- `artifacts/*-evidence.json`：测试、Git 与会话量化证据
- `reports/comparison.md`：适合审阅或影片展示的表格
- `reports/comparison.json`：可供其他程序复核的数据

`.benchmark-runs/` 默认不会提交，因为会话记录可能包含本机路径与 Session
metadata。公开前只发布已经检查过的报告。

## 开发验证

```sh
npm run check
```

这个命令会同时验证基准工具，以及“原始 fixture 必须失败、标准双文件修复必须
通过”。详细定义与限制请阅读 [METHODOLOGY.md](METHODOLOGY.md)。
