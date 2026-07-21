# 第三代之后的 Agent 遵循指标

状态：这是为第四代研究准备的工程 instrumentation；已冻结的 v1、v2.2、v3 结果完全不变。

## 新记录字段

每个新验证的 arm 可以记录：

| 字段 | 操作性定义 |
| --- | --- |
| `deliveredFullPathReopenedCount` | Routed Context 已完整交付 `full_file` / `full_symbol` 后，又被检查命令点名打开的命令/路径组合数。 |
| `deferredOpenedWithoutConflictCount` | 在失败调用或冲突信号出现前，无依据打开 Deferred 路径的命令/路径组合数。 |
| `excludedPathOpenedCount` | 后续检查命令点名 Excluded 路径的命令/路径组合数。 |
| `toolCallsBeforeFirstEdit` | 第一次检测到编辑命令前的有序 command/tool 调用数。 |
| `toolCallsAfterTestsPassed` | 最后一次编辑后，第一条成功测试命令之后的调用数。 |
| `callsAfterStopConditionSatisfied` | 测试成功且 `git diff --check` 与 `git status` 范围检查成功后，仍继续发生的调用数。 |
| `batchedVerificationUsed` | 同一条成功命令是否包含至少两类验证，例如 test 加 lint。 |
| `repeatedTaskRestatementCount` | Agent message 高覆盖复述任务、扣除第一次后的次数。 |

新生成的 comparison report 会为每个 arm 列出这些字段；当两边都成功且有效时，数值字段也会进入主要比较差值。

## 解读边界

这些字段是确定性的 transcript 启发式，不是语义意图判断，也不是操作系统级文件访问审计。它们用于定位可能的执行开销，不能单独证明 Palace 节省 Token 或时间。
