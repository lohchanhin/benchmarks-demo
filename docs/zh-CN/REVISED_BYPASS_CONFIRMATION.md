# 修订版 Bypass 工程确认

状态：**5 次探索性试验完成，20 个 Agent arm 全部有效且成功**。

[英文报告](../research/REVISED_BYPASS_CONFIRMATION.md) |
[最终命令机器摘要](../../results/revised-confirmation/final-command-summary.json) |
[精确命令机器摘要](../../results/revised-confirmation/exact-command-summary.json) |
[证据清单](../../results/revised-confirmation/manifest.json)

## 为什么要做这组确认

已经完成的 16 次候选研究证明 Adaptive Palace 能保持正确性与修改范围，
但相对 Control 仍消耗更多调用、时间与 reported tokens。逐条检查 transcript
后，发现两个可以直接修复的行为：为了找测试命令而重读 `package.json`，
以及把最终 Git 检查拆成多次调用。

这组资料属于候选研究之后的工程证据，不会改写已完成的候选研究，也不会
加入 formal v3 的观察值。

## 研发顺序

第一次试验只提供了更严格的执行指引，并写成「已知或惯用测试命令」。
Adaptive 仍然打开 `package.json`。它虽然正确且有效，但比 Control 多 1 次
调用、多 14,812 reported tokens，并慢 14.964 秒。

下一版改成由 Palace 在同一次调用内部解析仓库测试命令，再把 `run npm test`
写入原本只有三个字段的 bypass 输出。测试 artifact 绑定源码提交
`4b0440cd32270c951b13e83e0d18fd5038e1108f`，SHA-1 为
`19c8f5452050959ae6a7beb18dc71199a2174a76`。

最终候选版进一步缩短 bypass 原因，并输出一条包含目标文件的精确 Git 检查命令。
测试 artifact 绑定源码提交 `a29053f5952131887ff057a8fa7e6777ab045e1f`，
SHA-1 为 `9a04440d7e95c4d34e68e1b7e2cd3f6ecd62e83e`。

## 精确命令的两个配对

两个试验的所有 arm 都通过公开测试、hidden oracle、严格修改范围、任务忠实度
与 runtime 有效性检查。

| 试验 | 顺序前两项 | Adaptive - Control 时间 | 调用 | Reported tokens | 检索命令 | 引用路径 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `exact-command-small-local-02` | Adaptive -> Control | -2.313 秒 | +1 | +26 | -1 | -2 |
| `exact-command-small-local-03` | Control -> Adaptive | +2.141 秒 | +2 | +13,315 | -1 | -4 |
| **配对中位数** | 顺序平衡 | **-0.086 秒** | **+1.5** | **+6,670.5** | **-1** | **-3** |

时间为负代表 Adaptive 较快；调用或 token 为正代表 Adaptive 使用更多。

## 精确测试命令已经确认的改善

- 两个配对中 Adaptive 都选择 `bypass`，输出只有约 64 tokens。
- Adaptive 两次都没有再读取 `package.json`。
- Adaptive 两次都只引用 `src/format-currency.mjs`；Control 分别引用 3 与 5 条路径。
- Adaptive 两次都少 1 个检索命令。
- 配对中位时间差约 0.086 秒，实际可视为持平。

## 仍未解决的问题

Agent 没有稳定遵守「合并最终检查」的文字指令。一次把 `git diff` 与
`git status` 拆成两次，另一次把 `git diff --check`、`git status` 与目标 diff
拆成三次。因此即使 package 重读已经消失，仍保留多 1 到 2 次调用的成本，
目前也还不能声称节省 reported tokens。

因此下一版改为直接输出一条可执行的最终检查命令，而不是继续增加说明文字。

## 最终命令的两个配对

最终候选使用两组全新 seed，并交换 Control 与 Adaptive 的先后顺序。8 个 Arm 全部
通过公开测试、hidden oracle、严格修改范围、任务忠实度与 runtime 有效性检查。

| 试验 | 顺序前两项 | Adaptive - Control 时间 | 调用 | Reported tokens | 检索命令 | 引用路径 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `final-command-small-local-04` | Adaptive -> Control | -15.397 秒 | 0 | -33,698 | -1 | -4 |
| `final-command-small-local-05` | Control -> Adaptive | -3.492 秒 | +2 | -935 | -1 | -10 |
| **配对中位数** | 顺序平衡 | **-9.445 秒** | **+1** | **-17,316.5** | **-1** | **-7** |

两组中 Adaptive 都更快，也都减少 reported tokens 与 uncached input tokens；每次
只交付约 65 tokens，没有读取 package metadata，只检索并引用
`src/format-currency.mjs`。第一组 Control 有 1 次 router error 与 1 次失败调用，可能
放大差值；没有错误且 Control 先执行的第二组，Adaptive 仍快 3.492 秒并少 935
reported tokens。

## 当前结论边界

Agent 并没有把 Palace 提供的 Git 检查逐字复制成一个 shell call；两次都在同一个
model turn 内并行启动 3 个检查。因此「调用合并」仍未真正解决，但 package 重读与
重复仓库探索已经消失。

这两组结果是 small-local `bypass` 的正面候选证据，不足以证明 Vertex Palace 普遍
省时间或 Token。它们支持启动新的正式复验，也支持在保留这条说明边界的前提下发布
产品版本。
