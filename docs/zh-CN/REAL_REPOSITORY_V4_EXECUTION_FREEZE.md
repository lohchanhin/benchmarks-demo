# 真实仓库 V4 执行冻结

状态：取代前一版的 amendment 已由专案所有者审核并冻结。执行闸门：**10/10 通过**。
冻结时正式 Agent arm：**0/32**。

这份 amendment 补齐“研究设计已冻结、实际执行器尚未绑定”的缺口。它固定真正
执行时必须重复核验的 runner、产品包、Agent runtime、依赖 profile、验证基线与
隐私边界。

## 已绑定的执行身份

- Runner source commit：`5c4e39355962b60c627c663083da0d2e2022abf9`。
- Runner source SHA-256：`756eecd5514651b82864c99e67325ca99cd9263643ba6587e4f1a38e432709fd`。
- Vertex Palace source commit：`322b15ec6cbbbc9c86f0a03e54e7a13ebf050c5e`。
- 产品 tarball SHA-256：`1b042d3816f66108825bfecd44e5f4ac05cea0dec777ea424c866b8196187b09`。
- Execution profile SHA-256：`98a5417aae286f7fdc04951783dfb6b4ed0b789b6bcc90be8a879715bed24af6`。
- 私有 evaluator source SHA-256：`667daedc0b47b94f121085d6ced431d03aeee6b07c5af6297eb4b3b155532788`。
- Codex CLI `0.145.0-alpha.28`、模型 `gpt-5.6-sol`、`xhigh` reasoning。
- 每个 arm 使用全新 detached workspace，忽略用户规则与 config，并关闭 Agent 网络。

Node、npm、pnpm、Python、uv、上游依赖、基线与平台适配的精确事实都写在
`protocol/v4/execution.binding.frozen.json`。

## 冻结闸门

十项检查全部通过：binding 结构、冻结研究身份、私有 Oracle commitment、盲测
key commitment、runner 身份、产品 artifact、Codex runtime、execution profile、
所有者审核，以及空白正式结果状态。公开仓库只保存 commitment 与 hash，不公开
Oracle、arm 对应关系、私有参考解、原始 transcript 或本机路径。

这份 receipt 是专案所有者在 Codex 技术审核后的授权，**不是独立第三方审核**。

## 为什么需要后续 amendment

第一版 binding 启动时发现 Codex CLI 参数位置不相容。三次 fail-closed 尝试都在
session 建立前退出：Agent JSON event 为 0、完成 arm 为 0、代码改动为 0，也没有
可供查看的模型 outcome。公开的[事故记录](../../results/real-repository-v4/incidents/001-codex-cli-argument-order.json)
在修正前已经先提交。

修正内容只有把原本相同的全局 approval 参数移到 `exec` subcommand 前，并加入
精确参数顺序回归测试。任务、fixture、产品、模型、reasoning effort、sandbox、
Oracle、盲测、验证与统计全部没有改变。修正命令先通过冻结 Codex CLI 的真实 parser，
且没有启动 Agent；之后 binding 再次通过全部十项冻结检查。

下一次启动又发现第二个 pre-session Windows shim 问题：TOML 内嵌引号被再次转义，
strict-config 因而读到无效字段。这一轮同样是三次 infrastructure attempt、0 个
Agent JSON event、0 个完成 arm、没有 outcome。第二份[事故记录](../../results/real-repository-v4/incidents/002-codex-config-quoting.json)
在修正前先提交；随后把带引号的值改成 Codex 支持、语义相同的 raw TOML fallback
string。完整修正命令经冻结 Windows shim 成功载入 strict-config，再在刻意不存在的
workspace 停止，因此证明没有启动 Agent 就越过了 config 阶段。

前两份 binding 都保留在 Git 历史中。两次修正都没有改变 treatment、outcome 定义或
分析决定。

## 复验公开资料

```powershell
npm ci
node --test test/v4-execution-artifacts.test.mjs
npm run check
```

正式执行只允许在 `results/real-repository-v4/` 产生后续 commit：先建立空白盲测
ledger，再做不启动 Agent 的依赖 dry run，之后才运行 16 组配对 trial。每次启动
runner 都会重算冻结 binding；runner、hash、私有 commitment、环境事实或无关文件
发生变化时会直接拒绝执行。

闸门通过不代表 Vertex Palace 已经改善正确率、修改范围、时间或 Token。必须等
正式结果全部完成、解除盲测并依冻结统计计划分析后，才能回答这些问题。
