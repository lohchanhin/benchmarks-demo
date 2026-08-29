# 第六代全新仓库静态冒烟结果

## 结论

**路由结果为负面，但验证了一项真实的契约改进。**

当前候选版在自适应 JSON Context 超出 `route-lite` 上限时，不再直接报错，而是两次都稳定返回紧凑封包。然而，它在这个全新仓库中既没有找到核心实现，也没有找到聚焦测试。因此，本轮不能让候选版通过，也不支持“省 Token”“更快”或“提高 Agent 正确率”的宣传。

## 冻结方法

- 机械排除产品仓库与基准仓库历史中出现过的全部仓库身份。
- GitHub 搜索得到 100 个已合并 PR 节点，其中两个满足全新候选条件。
- 按预注册 SHA-256 排名选择 `djust-org/djust` PR [#2424](https://github.com/djust-org/djust/pull/2424)，对应 issue [#2421](https://github.com/djust-org/djust/issues/2421)。
- 在第一次 Palace 观察前冻结 base、merge、任务文本、隐藏真值承诺、包哈希与运行顺序。
- 候选版与 npm `0.4.0` 各运行两次；每次使用全新冷克隆，顺序执行并平衡先后次序。

隐藏 diff 只改了三个文件：

- 实现：`python/djust/components/function_component.py`
- 聚焦测试：`python/tests/test_render_slot_markup_2421.py`
- 明确附属证据：`CHANGELOG.md`

四次观察完成后，冻结的 oracle commitment 验证通过。

## 结果

| 指标 | 当前候选版 | npm 0.4.0 基线 |
| --- | ---: | ---: |
| Context 成功次数 | 2/2 | 0/2 |
| 实际交付 Context | 估算 1,365 Token | 无输出 |
| 实现/测试核心覆盖 | 0/2 | 不可用 |
| Route focus | 0.000 | 不可用 |
| 成功路线确定性 | 是 | 不可用 |
| Context 命令平均时间 | 93.340 秒 | 90.453 秒后失败 |
| 冷索引平均时间 | 746.181 秒 | 623.926 秒 |
| tracked-file 污染 | 0 | 0 |

公开 npm `0.4.0` 两次都出现相同错误：估算封包为 4,537 Token，超过 `route-lite` 的 2,400 Token 上限。候选版把它结构化降级到 1,365 Token 并正常返回。这证明预算契约修复有效，但不证明路由有效。

基线没有产出 Context，所以它的路线、覆盖、Token 与条件差异应该是**不可用**，不能写成零。第一版汇总曾错误地产生这些零值；[统计修正记录](../../results/fresh-repository-v6/analysis-correction.json)完整披露了这点，原始四次观察没有重跑或改写。

## 候选版实际找到了什么

两次候选路线完全一致，共八个文件，包括 Rust filter、通用 README、旧的 context safety 测试及其他 Python 支持文件；三个 oracle 文件全部遗漏。系统输出为 `route-lite`、置信度 `0.21`、证据不足、`stopEnforced=false`。

因此，这次失败不是随机抖动。路线很稳定，但稳定地找错了。

## 机制诊断

揭盲后的诊断发现了一个通用失效模式：

1. issue 正文把回归称为 “release blocker”，系统便把安全回归修复误分成 `release` 任务。
2. 任务分析其实已经抽取到 `RenderSlotTagHandler._render_value`、`render_slot` 和测试文件名。
3. 直接评分探针也给精确实现对象很高分，并确认 Room Inventory 的精确对象匹配；但最终路线没有保留这个锚点。
4. 长 issue 正文里的大量 `render`、`escape` 词随后把无关 filter 与旧安全测试推到前面。

所以，问题不在 Python 方法没有被索引，而在后续的任务意图优先级与精确锚点保留。机器记录见[机制诊断 JSON](../../results/fresh-repository-v6/mechanism-diagnosis.json)。

## 后续研发方向

这个已经公开的 djust 目标永久关闭调参资格，只保留为回归样本。下一步只做通用机制：

1. 只有任务真的要求 publish、tag 或 version 操作时，才允许分类为 release；描述风险的 “release blocker” 不能压过修复意图。
2. 明确出现的文件、类、方法和函数身份，在所有任务类型中都必须成为不可被替换的路线锚点。
3. 长 issue 正文只能作为有上限的辅助证据，不能与任务动作和精确标识符等权累加。
4. 使用中性 fixture 验证这些不变量，禁止加入 djust、issue 编号或特定路径规则。
5. 把冷索引性能单独立项；新克隆每次约 10-12 分钟，不符合交互式工具预期。
6. 下一次资格测试必须换另一个未公开、未调参的全新仓库。

## 声明边界

本轮只有一个历史任务、一个仓库，每个条件两次静态观察。它验证了“超预算仍能返回”的行为，也暴露了严重路由失败；不能据此推断整体路由质量、Token 节省、速度或端到端修复准确率。

原始证据：[静态结果](../../results/fresh-repository-v6/static-result.json)、[oracle reveal](../../results/fresh-repository-v6/oracle-reveal.json)、[选样冻结](../../protocol/v6/freeze.json)与[语义审核](../../protocol/v6/semantic-review.json)。
