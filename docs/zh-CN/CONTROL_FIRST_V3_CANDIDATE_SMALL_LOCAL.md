# 候选验证：Small Local 区块

状态：**候选研究完成 4/16 trial；尝试 16 个 Arm；15 个有效；14 个成功**。

这是 0.3.0 非正式发布前候选验证的第一个区块，不会进入正式 v3 manifest。

## 完整性

- 四个预注册 small-local trial 的 ID、seed、cache state 与 Williams 顺序均照计划执行，
  没有替换。
- 公开证据共有 32 个通过 checksum 的文件，不含原始 transcript、本机路径或 Session ID。
- 执行前重新确认本地 `vertex-palace@0.3.0` tarball 的 SHA-1 与 SHA-512 integrity 完全符合
  预注册计划。
- Control、Route-only、Adaptive 与 Full 都是顺序执行，从未同时进行。

## 正确性与修改范围

trial 01、02、04 完全符合配对条件。这三组的所有 Arm 都通过公开测试、隐藏 Oracle，
changed-file precision 与 recall 也都是 `1.0 / 1.0`。Adaptive 在三组都选择真正的
`bypass`，只输出 177 bytes（约 45 个估算 Token）；Full Palace 则输出 1,870 bytes
（约 468 个估算 Token）。

trial 03 会原样保留，不替换：

- Control 与 Route-only 有效且成功。
- Full Palace 的 treatment 有效，但执行超时，因此保留为失败结果。
- Adaptive 在网络启动失败期间尚未调用 Palace，所以属于无效 Arm；这组
  Adaptive-versus-Control 不进入正确率与效率配对。

## 阶段配对结果

目前只有三组有效 Adaptive-versus-Control 配对，下列数值只是工程信号，不是最终或普遍结论。

| 比较 | Reported Token 配对中位差 | 工具调用配对中位差 | 墙钟时间配对中位差 |
| --- | ---: | ---: | ---: |
| Adaptive - Control | +14,029（95% bootstrap CI +12,919 到 +14,215） | +2（CI +1 到 +3） | +6.086 秒（CI -2.581 到 +10.431） |
| Adaptive - Full | -21,261（CI -92,903 到 -2,852） | -2（CI -8 到 +2） | -8.023 秒（CI -55.937 到 +7.358） |

目前修改确实实现了预定机制：bypass 把 Palace payload 降低 90.5%，在三组配对中，相较
总是使用 Full Palace 也明显减少 reported tokens。但在这个刻意设计成单文件小修复的场景，
它仍未胜过普通 Codex。三组有效配对的正确性与修改范围相同。

## 基础设施事故

trial 03 的 Full Arm 开始于 `2026-07-20T13:41:54.968Z`。Windows System log 显示，
电脑在本地时间 `2026-07-20 21:43:36` 因 idle timeout 进入 Modern Standby，至
`22:42:28` 才恢复；该 Arm 数秒后以 `timedOut:true` 结束。Adaptive 后来又在另一次唤醒
窗口启动，stderr 在任何工具调用前就记录 `chatgpt.com` DNS 解析失败。

脱敏电源事件见
[`candidate-small-local-infrastructure-2026-07-21.json`](../research/evidence/candidate-small-local-infrastructure-2026-07-21.json)。
这证明候选 harness 缺少“无人值守时防止系统休眠”的控制。执行剩余区块前，要加入防休眠
机制并写入执行 metadata。trial 03 会继续公开，不会静默重跑或改写成成功。

## 阶段决定

继续研发与候选测试。这一组支持“true bypass 相对 Full Palace 有实质改善”，但不支持
“相对 Control 已提高效率”。仍需完成 cross-stack、decision-memory 与 stale-memory，才能
检验 Vertex Palace 真正希望解决的结构路由、历史决策与防重复踩坑价值。
