# Control-First v3 发布前候选验证

状态：**非正式、已预注册；预注册时为 0/16 trial**。

计划：[`results/control-first-v3-candidate/plan.json`](../../results/control-first-v3-candidate/plan.json)

Manifest：[`results/control-first-v3-candidate/manifest.json`](../../results/control-first-v3-candidate/manifest.json)

## 为什么先做这轮验证

npm 正式发布需要操作者在浏览器或安全密钥页面互动授权。操作者暂时不在电脑前时，
先用准备发布的同一份 `vertex-palace@0.3.0` 本地 tarball 跑完整 16 项 Agent 验证，回答一个
范围明确的工程问题：0.3.0 的修改在发布前是否真的对四类任务有用，还是仍有明显退化。

这不是正式 v3 研究。它使用独立目录与不同 trial ID，任何结果都不会写进正式 v3
manifest。正式计划继续保持未冻结，正式结果继续保持 0/16。

## 已锁定的候选条件

- 16 个 trial：四种场景各四个 seed。
- 64 个顺序执行的 Agent Arm：Control、Route-only、Adaptive Palace、Full Palace。
- 使用 Williams 平衡顺序；每个场景各有两个 warm 与两个 cold trial。
- 模型 `gpt-5.6-sol`、`xhigh` reasoning、每个 Arm 最长 600 秒。
- 外部隐藏 Oracle、严格 changed-file 范围与 treatment fidelity 检查。
- 精确包版本：`vertex-palace@0.3.0`。
- 源码提交：`e901c1739c5aa907bc44ebcbd25bbdd7abd75e7a`。
- 证据提交：`f2e0ccabb0f5a7af77a72b971524122469f47172`。
- Tarball SHA-1：`04602918f8e661a57c8286fb7b6d344baf9fb3aa`。
- 决策记忆场景的私密分配键不会进入 Git；计划只公开 SHA-256 commitment，避免看到结果后
  再更换情境答案。

候选计划也固定正式源计划的逐字节 SHA-256。只要计划、tarball、私密键 commitment、
Codex 版本或 Palace 版本不同，runner 就会拒绝执行。

## 如何执行与公开

每个场景区块会执行四个 trial，并只发布脱敏证据：

```powershell
npm run run:control-first:v3:candidate -- `
  --scenario small-local-bug `
  --tarball <精确的-0.3.0-tarball> `
  --key-file <操作者本机私密键文件>
```

之后依次执行 `cross-stack-regression`、`decision-memory-dependent` 与
`stale-memory-adversarial`。原始 transcript 只留在被 Git 忽略的 `.benchmark-runs/`；公开证据
带 SHA-256 校验，不含 Session ID 或本机路径。检查与分析命令：

```sh
npm run audit:control-first:v3:candidate
npm run analysis:control-first:v3:candidate
```

每完成一个四-trial 场景区块就提交并推送。负面、无差异、无效和失败结果都保留；完成全部
16 项与候选分析后，才判断是否适合发布 npm。

## 结论边界

这轮验证可以阻止有问题的候选版本发布，也能提供发布前工程证据；它不能替代正式 v3，
不能证明普遍性能提升，也不能宣称 Vertex Palace 在所有任务都更省 Token 或更快。
