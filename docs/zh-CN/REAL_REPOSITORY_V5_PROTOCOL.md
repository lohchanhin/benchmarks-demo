# 真实仓库 V5 测试协议

V5 使用 Click、Cobra、fd 与 Vitest 的 12 个全新历史修复任务，评估被冻结的 Vertex Palace 开发候选版。静态路由资格与端到端 Agent 结论严格分开。

## 目标选择

- 通过 GitHub GraphQL API，每个仓库最多读取最近 250 个已合并 PR。
- 必须有可关联的关闭 issue、2-8 个修改文件、最多 500 行变更、至少一个实现文件及一个聚焦测试文件。
- 排除依赖机器人，以及 release、纯文档、build、CI、依赖升级类型的 PR。
- 使用 `SHA-256(seed + repository + pull-request URL)` 对所有合格 PR 排序。
- 每个仓库选择一个本地信息完整任务、一个 GitHub 引用补全任务和一个高连接度任务；高连接度任务至少修改四个文件。
- 在任何选中任务交给 Palace 前，冻结 issue、父 commit、merge commit、候选产品 commit、随机种子、全部产物哈希和私有 diff oracle commitment。
- 看到结果后不得替换目标。
- 在任何目标级 Palace 调用之前，把每个完整 issue 与 pull request diff 当作一个语义整体审查。不可变结论及 diff 承诺写入 `protocol/v5/semantic-review.json`；只要有一个目标包含无关或无法确认的修改，整轮即失效。

## 静态资格门槛

开发候选版与 npm 公共 `0.4.0` 在每个目标上各运行两次，条件顺序平衡且禁止并行。合并后的 diff 不交给 Palace，只作为实现、聚焦测试与附属真值。

开发候选版只有同时满足以下条件才通过：宏观核心覆盖率至少 0.90，宏观 route focus 至少 0.70，每个目标覆盖率至少 0.50、focus 至少 0.40，重复路线完全确定，没有超过 6,000 个估算 Token 的 context，也不污染目标仓库 tracked 文件。

## Agent 门槛

只有静态候选版通过，才执行隔离的 Codex Agent Palace/Control 配对实验。每个目标在同一个父 commit 上执行一组顺序平衡的配对，共 24 个 arms。隐藏评估器检查目标测试、修改范围与已承诺的 diff oracle。正确率是首要指标；reported Token、工具调用和墙钟时间是次要指标。只有正确率保持非劣，且某项性能指标的配对 95% 区间完全位于有利方向，才允许宣传对应性能优势。

## 结论边界

静态失败会阻止 Agent 执行，只能支持路由诊断。即使完成 24 个 Agent arms，结论也只适用于本次样本，不能证明所有项目都节省 Token 或更快。
