# 第四代执行器设计

状态：执行基础设施实现与预跑阶段；第四代正式 Agent arm 仍为 0。

已冻结的 v4 计划固定了 fixture、trial 顺序、隐藏 Oracle commitment、盲测
commitment 与统计方法，但刻意没有绑定执行器。正式执行前必须再冻结一份独立的
execution amendment，不能直接拿未审核运行时开始测试。

## 必须固定的执行资料

- `protocol/v4/plan.frozen.json` 的 SHA-256 与首次包含它的 Git commit；
- Vertex Palace 精确源码 commit 与打包 tarball hash；
- runner 精确源码 commit 与 runner 文件 hash；
- Codex CLI 版本、模型、reasoning effort、timeout 与 cooldown；
- `workspace-write` sandbox，并明确关闭网络；
- 每个 arm 都从真实仓库 frozen commit 建立全新 detached checkout；
- 计时前的依赖安装命令；
- evaluator-only Oracle 与盲测 key commitment；
- 空白正式结果 manifest。

runner 必须先单独提交，之后 execution amendment 才能引用这个 commit，避免循环
hash。第二份公开人工审核 receipt 冻结 amendment。首次正式执行必须从该 binding
commit 开始；后续 resume commit 只允许修改 `results/real-repository-v4/`。

## 执行流程

1. 验证 frozen plan、公开 review receipt、私密 Oracle、arm key 与空白结果。
2. 在计时外取得真实上游仓库并验证 frozen commit object。
3. 为每个盲测 arm 建立全新且彼此独立的 detached workspace。
4. 安装依赖并确认 tracked baseline 干净。
5. 只为 Adaptive workspace 准备及预索引 Palace，并按预注册 profile 写入记忆。
6. Codex 忽略用户 config/rules，使用 ephemeral JSONL、never approval、
   workspace-write sandbox 与关闭网络。
7. 保存 transcript、stderr、last message、时间、版本及 Git evidence。
8. Agent 结束后才执行公开测试与外部隐藏 Oracle。
9. 公开证据必须移除 session id、私密路径、Oracle 内容和盲测 key。
10. 每批完成后增量提交；只允许跳过已经完整且不可变的 arm，残缺证据必须失败。

第一阶段 dry run 可以 clone、验证 commit、建立 workspace、解析盲测顺序并用本地
测试 fixture 检查 evaluator，但不得调用正式任务 Agent。网络隔离诊断必须标为
non-formal，不能进入 v4 结果 manifest。

本阶段不发布 npm、不打 Git tag，也不建立 GitHub Release。
