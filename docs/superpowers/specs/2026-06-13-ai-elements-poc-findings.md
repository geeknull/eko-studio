# AI Elements 迁移 PoC — 结论与全量迁移评估

- 日期:2026-06-13
- 分支:`poc/ai-elements`
- 关联:[设计](./2026-06-13-ai-elements-poc-design.md) · [计划](../plans/2026-06-13-ai-elements-poc.md)

## TL;DR / go-no-go

**结论:可行,建议增量迁移,但有明确成本与坑。** AI Elements + shadcn 能渲染本项目的 agent 消息,且与现有 antd **可共存**(首页验证无视觉回归)。聊天/消息层迁移收益清晰;但全量 `antd → shadcn` 是周级工作量,且 AI Elements 部分组件开箱不可用、对 agent 领域模型契合度参差。**建议:增量迁移,先从 MessageRenderer 着手,保留 antd 直到逐块替换完;不要大爆炸重写。**

PoC 全部验收通过:`tsc 0`、`eslint exit 0`、`40 单测通过`、`next build 成功`、`/demo 与 / 均 200`、视觉已截图确认。

## 逐类型映射结果(核心产物)

`DemoMessageRenderer` 按 `type` 用 AI Elements / shadcn 渲染 9 类消息:

| 消息类型 | 用的组件 | 契合度 | 说明 |
| --- | --- | --- | --- |
| text / normal | AI Elements `Message`+`MessageResponse`(streamdown) | ✅ 干净 | markdown 直出 |
| thinking | AI Elements `Reasoning` | ✅ 干净 | 可折叠,`streamDone` 映射 isStreaming |
| tool_* | AI Elements `Tool`(Header/Input/Output) | 🟧 需适配 | 我们的 `streamDone:boolean` 要映射成 AI SDK 的 `ToolUIPart.state` 枚举;`ToolOutput` 总按 JSON 高亮 |
| file(文本) | AI Elements `CodeBlock` | ✅ 干净 | — |
| file(图片) | 原生 `<img>` | 🟥 缺口 | AI Elements `Image` 要 `{base64,mediaType}`(AI SDK `Experimental_GeneratedImage` 形状),与我们的 `{data,mimeType}` 字段名不符 |
| workflow | shadcn `Card`+`CodeBlock(xml)` | ⬜ shadcn 自定义 | AI Elements 无 workflow/XML 对位 |
| agent_start / agent_result | shadcn `Card` 自定义 | 🟥 缺口 | AI Elements `Agent` 是 AI SDK `Tool[]` 形状(description/inputSchema),与我们的 `WorkflowAgent`(name/id/task/status)完全不同 |
| finish | shadcn `Card`(token 统计) | ⬜ shadcn 自定义 | 无对位 |
| error | shadcn `Alert`(destructive) | ✅ 干净 | — |

**汇总:3 个干净对位、1 个需适配(tool)、2 个缺口(file 图片 / agent)、3 个用 shadcn 自定义(workflow/finish/error)。** 即:**AI Elements 对"标准 LLM 聊天"很顺,但本项目特有的 agent/workflow 领域模型(BrowserAgent 的 WorkflowAgent、Eko 的 workflow XML)它没有对位,需 shadcn 自己搭。**

注:AI Elements 无 `Response` 独立组件(markdown 在 `MessageResponse`/streamdown 内)。

## shadcn + antd 共存结论

**首页 `/`(antd)在装了 shadcn 全局样式后无视觉回归**(已截图确认:Header、Mode 切换、Configuration、聊天卡片、Sender 均正常)。要点:

- **Tailwind preflight 本就和 antd 共存**:项目原先就有 `@import "tailwindcss"`(含 preflight),antd 一直在其之上正常工作,所以 shadcn 不引入新的 reset 冲突。
- **唯一真回归是字体**:shadcn `init -d` 把 `globals.css` 整体覆盖,将 `--font-sans` 写成循环引用 `var(--font-sans)`,叠加 `@layer base html { @apply font-sans }` 会让整页字体落到浏览器默认。**已修**:恢复 `--font-sans: var(--font-geist-sans)`。
- shadcn 的 `* { @apply border-border }` 优先级低于 antd 组件样式,实测无影响。
- **暗色模式机制变更**:shadcn 用 `.dark` class 取代了原 `@media (prefers-color-scheme)`。若以后要 OS 级暗色需自行接 class 切换(当前项目影响小)。

## 安装 / 集成踩坑(成本项)

1. **`shadcn init -d` 过于激进**:用 `base-nova` 预设整体覆盖 `globals.css`(27→130 行)并自动加了 button.tsx。全量迁移时应用更克制的 init 或 init 后人工校正 globals。
2. **6 个 AI Elements 组件开箱不过 tsc**:attachments / context / inline-citation / plan / prompt-input / voice-selector —— 根因是它们针对的 `@base-ui/react` API 与 CLI 装入版本有偏差(PreviewCard `openDelay`、Button props、事件类型)。PoC 删除了这些未用组件。**全量迁移若需要 prompt-input(聊天输入,很可能要),需解决 base-ui 版本对齐。**
3. **73 个 vendored 组件不合项目严格 eslint**(2900+ 问题:单引号/quote-props/comma-dangle)。已将 `src/components/ui`、`src/components/ai-elements` 及生成的 `sample-messages.ts` 加入 eslint 忽略,按 node_modules 对待(CLI 更新会覆盖本地改动,不可手 fix)。
4. **`/demo` 有一处非致命 SSR hydration 警告**(很可能来自 `Conversation`/`StickToBottom` 客户端测量)。页面渲染正常;生产中需 `suppressHydrationWarning` 或纯客户端边界。
5. 新增依赖:`ai@6`、`streamdown`、`nanoid`、`tokenlens`、`use-stick-to-bottom`(+ shadcn 的 clsx/tailwind-merge/cva/lucide-react/tw-animate-css/@base-ui/react)。

## 全量 antd → shadcn 迁移工作量估算

使用面:**20 个文件 import antd**,2 个用 `@ant-design/x`,13 个用 `@ant-design/icons`。组件频次:Button 36、Tag 25、Space 25、Form 15、Card 13、Descriptions 12、Tooltip/Collapse/Alert 各 5、Input 4、Select 3、Avatar 3、Modal 2、Tabs 2 + X 系(Bubble/Sender/ThoughtChain/XProvider)。

按改造难度分组:

| 分组 | 文件 | 难度 | 说明 |
| --- | --- | --- | --- |
| 消息渲染(9 个 renderer + index + useMessageItems + WorkflowAgentCard) | messageRenderer/** | 中 | **PoC 已原型化约一半**(DemoMessageRenderer)。Bubble.List→Conversation/Message;Descriptions→自定义 KV;antd Tag/Card/Collapse→shadcn 对应 |
| 配置表单(ConfigModal / NormalConfigForm / ReplayConfigForm) | home/Config*、*Form | **高** | antd `Form`(15 处)→ shadcn 走 react-hook-form + zod,是**真重写**,不是换组件 |
| 外壳/控件(layout / page / HeaderControls / ServerErrorNotification / JsonViewModal) | app/**、home/HeaderControls 等 | 低-中 | Button/Tag/Space/Modal/Tabs→shadcn 对应;Space→flex+gap;antd `message`/`notification`→sonner |
| 图标 | 13 个文件 | 低(量大) | `@ant-design/icons`→`lucide-react`,逐个替换 |

**shadcn 无直接对位、需自定义**:`Descriptions`(12 处,搭 KV 布局)、`Space`(25 处,改 flex 工具类)、antd `Form` 体系。

**粗估:** 消息层 ~1.5-2 天(已有原型),配置表单 ~2-3 天(react-hook-form 重写),外壳+图标 ~1-1.5 天。合计 **~1 周(单人)**,纯工程投入、功能零增益。

## 建议(节奏)

1. **增量,从 messageRenderer 起步**:DemoMessageRenderer 已证明可行,先把 `/` 的消息渲染切到 AI Elements/shadcn(antd 与 shadcn 并存),最高频且 PoC 已铺路。
2. **解决 prompt-input 的 base-ui 版本对齐**(若要用 AI Elements 的聊天输入替代 Sender)。
3. **配置表单最后做**(成本最高、收益最低;Form→react-hook-form)。
4. 全程保持 antd 与 shadcn 并存,一块块替换、每块过 tsc/lint/build/CI,不停机、不大爆炸。
5. 处理 `/demo` 暴露的 hydration 警告作为生产化前提。

**是否启动全量迁移由你拍板。** 若启动,以上是建议路径;PoC 分支可作为参考实现保留,或在决定后清理。
