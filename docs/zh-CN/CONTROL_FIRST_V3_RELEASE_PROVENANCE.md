# Control-First v3 发布来源闸门

日期：2026-07-20

机器证据：[control-first-v3-release-provenance-2026-07-20.json](../research/evidence/control-first-v3-release-provenance-2026-07-20.json)

## 当前状态

正式 v3 研究仍刻意保持未冻结：16 个 trial、64 个 Agent Arm 都尚未执行。本阶段
只增加可执行的安装包来源校验，不算 Agent 结果，也不宣称已经提高效率。

Vertex Palace 实现提交固定为
`97d1736f971438f7f2913f0b731633b0bab8441d`，发布候选 HEAD 为
`8328ea29d55260e34e2e6170bd420e4c659af39e`；两者之间只多了不进入 npm 包的机器
证据 JSON。多次 `npm pack --dry-run` 都产生相同的 7 文件 `vertex-palace@0.3.0`：

- SHA-1：`4f4f7843cbfebaec0a9f3aade31fac24d96d1133`
- integrity：`sha512-wfxQUxLKk1kQxQm8X1eGKbRaXX/yxIla8KO6PAxj83Fx+7ofwQSzla6tTVvLIlBOxchGy0OmopFdS684GDz9RA==`

发布前已经通过产品 lint、89 项测试、build、MCP smoke、干净安装包验证，以及固定
Zod／Requests 仓库验证。

## npm 发布尝试

`npm whoami` 已确认账号为 `lohchanhin`。0.3.0 发布进入 npm 官方浏览器授权页后，
授权没有在 CLI endpoint 过期前完成，因此返回 `E404`。Registry 回读仍找不到
`vertex-palace@0.3.0`，所以没有半发布或来源不明的 0.3.0。Benchmark 依赖会继续
保留 0.2.1，直到新的互动授权成功并完成 registry 回读。

## 新增防线

v3 计划 schema 升为 6。除了版本与源码提交，它还预注册发布提交、tarball SHA-1
和 npm integrity。任何正式 Agent Arm 启动前，runner 都会核对：

1. `package.json` 是否要求精确版本；
2. `package-lock.json` 的根依赖和包记录是否都是该版本；
3. resolved URL 是否指向预期 npm tarball；
4. lock integrity 是否与计划完全相同；
5. 实际安装包是否报告精确版本。

单元测试证明正确安装会通过，篡改 integrity 会失败。加入可执行闸门前，完整
benchmark check 已通过 63/63 测试、5 个 fixture contract、所有历史 evidence audit、
v2.2 分析重现；v3 公开 manifest 仍为 0/16。

后续新增 `npm run gate:control-first:v3`，以及先跑全套检查的
`npm run check:release-ready`。第一次真实执行通过 11/19，失败的 8 项都符合现状：
registry 没有 0.3.0，`package.json` 与 lockfile 的版本、tarball URL、integrity 仍属于
0.2.1；但本机 `node_modules` 却显示 0.3.0。这证明只检查本机安装目录会错误判断为已就绪。
闸门不会启动 Codex，也不会输出 npm 授权网址或 registry 错误正文。
它会显式查询 `https://registry.npmjs.org`，并从 npm 子进程环境移除盲测情境密钥。
加入两项闸门测试后，完整套件再次通过 65/65，fixture、历史证据与空 manifest 保证不变。

## 路由自评

Vertex Palace 命中 7 个实际改动中的 5 个，coverage 与 focus 均为 0.71，confidence
为 0.35；它漏掉根目录简体中文 README 和核心 `src/commands/study.mjs`，所以仍是
`needs-review`。99.6% repository-to-pack 缩减只代表选择的上下文较小，不能当作
Agent 总 Token 或执行时间下降的证据。

可执行闸门的后续自评进一步暴露 release 路由缺口：默认路线只命中 3/11，coverage
0.27、focus 0.30；把 route limit 扩到 40 也只命中 4/11，coverage 0.36，focus 反而
降到 0.17。两者 confidence 都是 0.35，校准没有虚高，但都漏掉新的核心
`src/lib/release-gate.mjs` 和大部分双语证据。扩大上限主要加入无关 fixture 与旧记忆
证据，因此后续产品方向应是源码、测试、脚本、文档的 sibling／provenance 路由，不能
把较小 context pack 当成“已经足够”的证明。

## 下一道闸门

等使用者在场时重新完成 npm 官方浏览器授权，再从 registry 核对 shasum 与 integrity，
把本仓库升级到精确 0.3.0，以干净 `npm ci` 重跑完整检查。之后才生成私密盲测密钥、
提交 commitment、冻结计划并打协议 tag；冻结 tag 之前不能执行任何正式 Arm。
