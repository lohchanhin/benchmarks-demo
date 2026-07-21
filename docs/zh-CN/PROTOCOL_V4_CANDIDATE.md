# 第四代真实仓库候选协议

状态：**已人工批准并冻结，未执行**
协议：`4.0.0-candidate.1`
协议字段标签：`protocol-v4.0.0-candidate.1`（不是 Git tag）
主要比较：Adaptive Palace 对 Control

## 为什么要做第四代

已完成的 Control-first v3 证明：在依赖历史决策的任务中，Palace 有明显的正确性与范围优势；但它没有证明普遍节省 Token 或更快。陈旧记忆场景也显示，虽然错误记忆能被安全拒绝，拒绝过程本身仍有固定成本。

所以第四代不再问“Palace 是否处处更快”，而是研究一个更窄、也更有价值的问题：

> 在真实 Issue 与真实项目历史中，Adaptive Palace 能否减少错误修改范围，同时不降低正确性，并控制每个成功解法的成本？

v1、v2.2、v3 的原始计划与结果完全保留；旧结果不会被当成第四代的新证据。

## 四个真实任务候选

每个工作区都固定在不可变的 40 位 commit。正式执行时关闭 Agent 网络，避免 Agent 直接搜索后来已经公开的上游答案。公开 fixture 不包含参考补丁、正确文件范围或禁止修改文件。

| 类型 | 真实仓库与 Issue | 冻结 commit | 语言 | 验证 |
| --- | --- | --- | --- | --- |
| simple-local | [Zod #4926](https://github.com/colinhacks/zod/issues/4926) | `7dd7484802b1351c8b81d3d523aadd876fcdf73e` | TypeScript | 聚焦 Vitest |
| cross-stack | [Open WebUI #25919](https://github.com/open-webui/open-webui/issues/25919) | `e473ab1231abedcb188c259b42ae7f2390739223` | Python + TypeScript | Svelte check + backend pytest |
| decision-memory-dependent | [Zod #5509](https://github.com/colinhacks/zod/issues/5509) | `6e968a3b49cb3bffc30c68634e80168e8f2a2e` | TypeScript | 聚焦 Vitest + 精确范围 Oracle |
| stale-memory | [Requests #7432](https://github.com/psf/requests/issues/7432) | `0b401c76b6e80a4eecf3c690085b2553f6e261ca` | Python | 聚焦 pytest |

决策记忆任务使用 [Zod 维护者的历史决定](https://github.com/colinhacks/zod/issues/4688#issuecomment-2967793697)与冻结版本文档作为 provenance。陈旧记忆任务把 [Requests typing migration](https://github.com/psf/requests/commit/561e4b6889f53584c39a67f8794c53a414f68481)作为刻意过期的建议；当前代码、测试与外部隐藏 Oracle 始终优先。

仓库所有者 HIN 已在 Codex Session `019f4280-40ee-7172-b94d-f5aa7aa46814` 明确批准任务文字、协议、私密 Oracle commitment 与冻结；Codex 完成技术审计。公开 receipt 如实标注这不是独立第三方审核，因此正式执行前仍建议做一次独立复现。

## 实验设计

- 四种任务类型各一项真实 fixture。
- 每项四次独立配对：共 16 个 trial、32 个 Agent arm run。
- 每项包含两次 cold 与两次 warm。
- 每项内平衡 `arm-a/arm-b` 与 `arm-b/arm-a` 顺序。
- 每个 arm 使用全新 worktree 与全新 Agent session。
- 主要比较只有 `adaptive-palace` 与 `control`。
- Agent 执行期间禁止网络访问。
- 除预注册的基础设施重试外不允许重试；任何重试成本都计入统计。

盲测 arm 对应关系与精确 Oracle 只保存在 evaluator-only 文件。公开计划只记录二者的 SHA-256 commitment，而且不会把私密文件复制进 Agent 工作区。

## 外部隐藏 Oracle

每个私密 fixture 包含：

- 上游参考解法与不可变 commit；
- 行为正确性条件；
- 精确 changed-file 集合；
- 禁止修改路径；
- `exact-files` 或 `no-code-change` 范围政策。

Git 只提交 canonical JSON 的 hash。当前电脑默认把真实 Oracle 放在被忽略的 `.benchmark-private/v4/oracle.json`；独立评审者也可以使用仓库外路径。公开的 oracle template 只有占位内容，不是答案。

## 执行前冻结的统计方法

主要判断顺序预先固定为：

1. hidden oracle 正确性；
2. 是否出现 forbidden scope 或非精确修改范围；
3. `cost_per_successful_solution`；
4. `success_weighted_reported_tokens`；
5. `retry_adjusted_cost`。

定义如下：

- `cost_per_successful_solution`：成功、失败及重试的全部实际成本，除以成功解法数。
- `success_weighted_reported_tokens`：通过 Oracle 的成功解法之 reported Token 平均值；必须同时报告成功率。
- `retry_adjusted_cost`：初次执行与所有允许的基础设施重试成本总和，除以最终成功解法数。
- `hierarchical_win`：每个配对先比 success，再比 exact scope，再比更低 Token，最后比更短时间；只有前一层相同才进入下一层。

区间采用按 fixture 分层的 paired bootstrap，10,000 次重采样，95% confidence level。Token、tool calls、Agent adherence 与时间的其他分析均为描述性次要指标，不得在看过结果后升级成主要结论，也不得按结果删除样本。

## 冻结闸门

保留的审核前 draft 明确保持：

```text
frozen: false
humanReviewApproved: false
executionAllowed: false
formalAgentTrialsRun: 0
runnerAvailable: false
```

所有者授权且本机闸门 11/11 通过后，`plan.frozen.json` 现在是：

```text
frozen: true
humanReviewApproved: true
executionAllowed: true
formalAgentTrialsRun: 0
runnerAvailable: false
```

冻结闸门检查协议身份、四个 fixture、公开计划无答案泄漏、预注册统计、Oracle commitment、盲测密钥 commitment、精确人工审核 receipt，以及空白 execution manifest。闸门失败时不能写出 frozen plan。代码中刻意没有 `v4-run` 命令。

```bash
npm run v4:plan
npm run v4:gate
npm run check:v4-prep
```

在准备用电脑上，私密 Oracle、盲测密钥与公开人工审核 receipt 已通过全部 11 项检查。公开 clone 无法重算四项 evaluator-secret 检查，因此会把它们显示为 blocked，同时仍可验证 receipt 与冻结审计。PR5 刻意没有提供 `v4-run`，所以正式 trial 仍为 0。

## 审核记录与执行前剩余检查

1. 独立核对每个 Issue、冻结 commit 与测试命令。
2. 审查私密 Oracle，但不得把它搬进公开 Git。
3. 确认 exact / forbidden 范围不会泄漏给 Agent。
4. 确认网络隔离、干净 worktree 与 session 独立性。
5. 在看到任何结果前确认统计层级与成本公式。
6. 对精确 plan、fixture、Oracle 与 arm-key hash 签署 receipt。所有者已明确授权完成。
7. 执行 `v4-gate --require-ready`；全部通过后才允许冻结。本机已完成 11/11。

冻结完成不等于已经证明产品有效。只有完成预注册的真实仓库试验并可供外部审计以后，才能形成第四代研究结论。
