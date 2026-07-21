# 真实仓库 V4 Agent 预检

状态：通过，并预先登记平台适配。正式 Agent 执行数：**0/32**。

这次预检在第一场正式 Agent 会话之前，实际检查了四个冻结上游仓库、固定工具链、
依赖安装与公开验证命令。预检发现两个若不处理就会造成错误结论的环境事实，现已
统一绑定在 `protocol/v4/execution.profile.json`。

## 可复现运行环境

- Node.js 22.23.1，来自官方 Windows x64 压缩包并校验 SHA-256。
- npm 10.9.8，pnpm 10.12.1，由固定 Node/Corepack 提供。
- CPython 3.11.9 与 uv 0.11.30。
- Codex CLI 0.145.0-alpha.28，安装在隔离的私有运行目录。
- Windows 正式工作目录只使用 ASCII 路径，Git 固定 `core.autocrlf=false`。
- Agent 执行时关闭网络；所有依赖在计时开始之前完成安装。

四个冻结提交与私有参考解答提交都已存在于已验证的本地镜像。Requests 的依赖解析
结果使用哈希锁定在 `protocol/v4/dependencies/requests-win-py311.txt`。

## 基线与适配

两个 Zod 聚焦测试在冻结基线都干净通过：transform 情境 34 项，decision 情境 54 项。

Requests 基线为 335 passed、1 skipped、1 xfailed，并预先排除 1 项测试。被排除的 TLS
测试依赖仓库中的符号链接，而当前 Windows 帐号不能建立该链接；它与 stream detection
问题无关。此规则在看到任何 Agent 结果前固定，并对两个 arm 完全相同。

Open WebUI 冻结提交的 `npm run check` 本来就会失败，基线为 9,702 errors、274 warnings、
386 files。因此 V4 比较 Agent 是否相对冻结基线新增诊断，而不会把继承的非零退出码
算成 Agent 失败。另一个公开命令 `python -m pytest -q backend/tests` 也被实际证明无效，
因为冻结提交中不存在该目录。协议仍保留并标注这条命令为 preflight-invalid，后端语法
与任务正确性改由外部隐藏评估补足。

## 完整性边界

公开证据记录 Requests 锁文件、Open WebUI 原始基线和私有 evaluator 的哈希，但不会
泄露 oracle 内容。Control 与 Adaptive 使用相同 checkout、运行时、依赖、任务、验证
规则和 evaluator，唯一差异是预先登记的 Palace treatment。

发现并绑定以上适配时，没有调用任何正式任务 Agent。
