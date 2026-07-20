# 候选修订 1：无人值守防休眠守卫

记录时间：候选研究完成 4/16 trial 之后、任何 cross-stack 候选 Arm 之前。

Windows System event 已证明 Modern Standby 中断 small-local trial 03。由于这轮是判断
候选包是否适合发布的非正式验证，剩余 12 个 trial 会启用进程范围的
`ES_CONTINUOUS | ES_SYSTEM_REQUIRED` 请求。它不会保持屏幕亮起，并会在每个场景区块
结束时释放。

这是看到阶段结果后的基础设施修订，不属于原始预注册。它不改变产品 treatment 或实验任务：
trial ID、seed、Williams 顺序、cache state、模型、reasoning effort、timeout、包内容、prompt、
测试与隐藏 Oracle 都不变。既有 trial 不替换，trial 03 的失败与无效 Arm 继续公开。

后续每个场景区块都会在候选 manifest 记录守卫是否启用、采用方式、是否正常释放及区块错误。
若无法取得守卫，runner 会在安装或 Agent 执行前停止。正式 v3 在冻结前也应纳入这项控制；
本修订不会修改正式 v3。
