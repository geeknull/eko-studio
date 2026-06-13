# AI Elements 迁移 PoC — 设计文档

- 日期:2026-06-13
- 状态:已与用户确认设计,待写实施计划
- 分支:`poc/ai-elements`

## 背景与目标

项目当前 UI 选型为 `antd` v6 + `@ant-design/x` v2(聊天组件:Bubble.List / Sender / ThoughtChain / XProvider)。`@ant-design/x` 较新、社区小、AI 训练语料少(本次 eko 升级已踩到其 v2 破坏性变更)。用户决定迁移到 **Vercel AI Elements**(基于 shadcn/ui + Tailwind 的 AI 界面组件库),理由:生态更主流、AI 辅助开发更友好、组件源码进仓库可免 version-lock。

本工作**不是**全量迁移,而是一个 **PoC**:用最小成本验证可行性并量出全量迁移的真实工作量,产出 go/no-go 依据。全量迁移是否进行、如何进行,由 PoC 结论决定。

### 已确认的前提

- **后端保留 eko + 自写 SSE**。AI Elements / AI SDK 替不掉 eko 的 BrowserAgent(浏览器自动化),本 PoC 只动前端展示层。
- 前端消息是自定义联合类型 `StreamCallbackMessage`,经 `messageMerger` 合并、`useMessageItems` 转 Bubble.List items 渲染。
- 数据源:`agent-log/` 已有 3 个真实录制日志,覆盖全部消息类型(workflow / thinking / normal / text / tool_streaming / tool_use / tool_result / finish / agent_start / agent_result)。

## 范围

### In scope(PoC)

1. 在现有项目(Next 16 + React 19 + Tailwind 4 + antd 6 共存)中安装 shadcn/ui + AI Elements。
2. 新增隔离的 `/demo` 路由,用**录制日志的真实静态样本**渲染各类型消息。
3. 用 AI Elements 组件实现一套 `DemoMessageRenderer`,按 `StreamCallbackMessage.type` 分发(沿用现有策略分发结构)。
4. 验证 shadcn 全局样式与 antd 共存,确认首页 `/` 无视觉回归。
5. 产出工作量评估文档与 go/no-go 建议。

### Out of scope(PoC 不做)

- 不改现有 `/` 主流程、不替换 antd、不删 `@ant-design/x`。
- 不接 live SSE / 不真跑 agent(数据用静态录制样本)。
- 不引入 AI SDK 的 `useChat` / 不改 SSE 协议(保持 eko + 现有 SSE)。
- 不做全量 `antd → shadcn` 迁移(由 PoC 结论再决定)。

## 选定方案

**方案 C:AI Elements 作为样式化原语 + 沿用现有 renderer 分发。**

保留现有 MessageRenderer 的"按 type 策略分发"结构,仅把 antd 视觉件换成 AI Elements 视觉件。

排除的备选:
- 方案 A(写完整适配映射层):与 C 本质重叠,C 已包含按类型映射。
- 方案 B(重塑成 AI SDK `UIMessage`/parts,用 AI Elements 原生 parts 渲染):只有将来改用 `useChat` 才划算,而前提是保留 eko,故为过度投资。

选 C 的理由:精确回答 PoC 要回答的问题(换皮成本),保留已验证的 eko/SSE 与分发结构,不绑死不会采用的 AI SDK 数据模型。

## 架构与结构

- **路由**:新增 `src/app/demo/page.tsx`,带自己的最小 layout(`src/app/demo/layout.tsx`),把"shadcn 全局样式 vs antd reset/preflight 冲突"的风险限制在该页面内,便于对照首页判断共存。
- **样本数据**:`src/components/demo/sample-messages.ts` —— 从 `agent-log/` 各类型抽 1 条真实消息,固化为常量并提交(确定性、不依赖被 gitignore 的日志)。
- **渲染**:`src/components/demo/DemoMessageRenderer.tsx` —— 按 `type` 分发到 AI Elements / shadcn 组件;未知 type 走 fallback(沿用现有 `DefaultRenderer` 思路)。
- **AI Elements 组件**:由 CLI 安装到 `src/components/ai-elements/`(进仓库、可自定义)。
- **shadcn 基建**:`components.json`、globals.css 的 CSS 变量与 base 层、`src/lib/utils.ts` 的 `cn()`。

数据流:`sample-messages.ts`(静态)→ `/demo` 页 map → `DemoMessageRenderer`(按 type)→ AI Elements / shadcn 组件。无 store、无 SSE、无网络。

## 类型 → 组件映射(PoC 核心产物)

| StreamCallbackMessage.type | 目标组件 | 预期 |
| --- | --- | --- |
| `text` / `normal` | `Message` + `Response`(markdown) | 干净对位 |
| `thinking` | `Reasoning`(可折叠思考面板) | 干净对位 |
| `tool_streaming` / `tool_use` / `tool_result` | `Tool`(ToolHeader / ToolInput / ToolOutput) | 大致对位 |
| `file` | `Image` / `CodeBlock` | 大致对位 |
| `workflow` | `Task` 或 `CodeBlock`(XML) | 缺口候选 |
| `agent_start` / `agent_result` | shadcn `Card` 自定义 | 缺口(无对位) |
| `finish` | 自定义 token 统计(shadcn) | 缺口(无对位) |
| `error` | shadcn `Alert` / 自定义 | 缺口(无对位) |

"缺口"项需要多少自定义工作,正是 PoC 要量化的成本。

## 错误处理

PoC 为静态渲染:`DemoMessageRenderer` 对未知 / 缺字段的 type 渲染 fallback 卡片(展示原始 JSON),不抛错,镜像现有 `DefaultRenderer` 行为。

## 验收标准

- `npx tsc --noEmit` 0 错误;`pnpm lint` exit 0;`pnpm build` 通过。
- 首页 `/`(antd)安装 shadcn 后**视觉无回归**(重点核对:布局、antd 组件样式未被 Tailwind preflight / shadcn base 破坏)。
- `/demo` 能渲染全部 8 类消息(含缺口项的自定义实现)。
- 为类型→组件分发函数补一条单测(`pnpm test` 仍全绿)。
- 用浏览器/截图实际查看 `/demo` 与 `/` 两页确认渲染正确。

## 交付物

产出 `docs/superpowers/specs/2026-06-13-ai-elements-poc-findings.md`:

- 逐类型映射结果:干净 / 需自定义 / 缺口,各自代码量。
- shadcn + antd 共存结论:有无冲突、对策。
- 全量 `antd → shadcn` 迁移工作量估算(antd 在 ConfigModal / 各 renderer / JsonViewModal / 布局的广度)。
- go/no-go 建议:是否值得全量迁移、若迁建议的节奏。

## 风险

- **共存冲突(主要风险)**:shadcn 依赖 Tailwind preflight + CSS 变量;antd v6 自带 reset 与 ConfigProvider 主题。两者全局样式可能互相覆盖。对策:`/demo` 隔离 + 安装后逐页核对首页。
- **Tailwind 4 兼容**:shadcn init 需适配 Tailwind 4(`@import "tailwindcss"` 形态);若 CLI 默认按 v3 改写 config 需手工校正。
- **AI Elements 组件缺口**:workflow/agent/finish/error 无原生对位,自定义量未知 —— 这是 PoC 要量的核心。
