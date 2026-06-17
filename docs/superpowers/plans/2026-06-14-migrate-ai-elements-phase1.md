# AI Elements 迁移 — Phase 1(消息渲染层)实施计划

> **For agentic workers:** 用 superpowers:subagent-driven-development 或 executing-plans 逐 task 执行。步骤用 `- [ ]` 勾选跟踪。

**Goal:** 把真实首页 `/` 的 agent 消息渲染从 antd(`@ant-design/x` `Bubble.List` + 9 个 antd renderer)切换到 AI Elements `Conversation` + shadcn,复用 PoC 已验证的 `DemoMessageRenderer`。输入框 `Sender`、配置弹窗、Header 暂留 antd(后续 Phase)。

**Architecture:** 增量、antd 与 shadcn/AI Elements 并存。AgentChat 的消息列表层换成 AI Elements `Conversation`;每条消息按 role 渲染(user → 纯文本/Message;assistant eko 消息 → 新的 `AgentMessage` 渲染器,即 PoC `DemoMessageRenderer` 的生产化版本 + 「View JSON」)。后端 eko/SSE、消息 store、`messageMerger` 不动。

**Tech Stack:** Next 16 · React 19 · AI Elements · shadcn/ui · zustand(现有)· Vitest

**分支:** `feat/migrate-ai-elements`(已基于 poc/ai-elements 的 shadcn+AI Elements 安装)

> 说明:AI Elements 组件 props 以 `src/components/ai-elements/*` 实际源码为准;PoC 的 `DemoMessageRenderer.tsx` 已是完整的按-type 渲染参考实现。

---

## 文件结构

- 移动/生产化:`src/components/demo/DemoMessageRenderer.tsx` → `src/components/messageRenderer/AgentMessageRenderer.tsx`(去掉 demo 字样,补 onViewJson)。
- 改写:`src/components/home/AgentChat.tsx`(`XProvider`/`Bubble.List` → AI Elements `Conversation`)。
- 新增:`src/components/messageRenderer/AgentMessageRenderer.test.ts`(分发烟囱测试,复用 demoRenderer 逻辑)。
- Phase 末删除(被取代后):`src/hooks/useMessageItems.tsx`、`src/components/messageRenderer/renderers/*`(9 个 antd renderer)、`src/components/messageRenderer/index.tsx`、`src/components/messageRenderer/WorkflowAgentCard.tsx`。**仅在确认无 import 后删除。**
- 保留:`src/components/demo/*`、`/demo` 路由(作 PoC 参考,Phase 4 再清);`sample-messages.ts`;`Sender`、`ConfigModal`、`HeaderControls`(后续 Phase)。

---

## Task 1: 生产化消息渲染器(promote DemoMessageRenderer)

**Files:**
- Create: `src/components/messageRenderer/AgentMessageRenderer.tsx`(从 `src/components/demo/DemoMessageRenderer.tsx` 复制改造)
- Reference: `src/components/demo/demoRenderer.ts`(`resolveDemoRenderer`,直接复用)

- [ ] **Step 1: 复制 DemoMessageRenderer 为 AgentMessageRenderer**

把 `src/components/demo/DemoMessageRenderer.tsx` 的内容复制到 `src/components/messageRenderer/AgentMessageRenderer.tsx`。调整:
- 组件改名 `DemoMessageRenderer` → `AgentMessageRenderer`,props interface 同步改名。
- import 路径按新位置改:`./demoRenderer` → `@/components/demo/demoRenderer`(或把 demoRenderer 一并移到 messageRenderer/ 下并更新 import;二选一,保持一处)。
- 其余分支逻辑、narrow 类型、no-`any` 全部保留。

- [ ] **Step 2: 增加「View JSON」入口(替代旧 useMessageItems 的能力)**

在 `AgentMessageRendererProps` 增加可选 `onViewJson?: (content: StreamCallbackMessage) => void`。在每条消息渲染外层包一个相对定位容器,右上角放一个 shadcn `Button`(`variant="ghost" size="sm"`,lucide `EyeIcon`),`onClick={() => onViewJson?.(content)}`,仅当 `onViewJson` 存在时渲染。不破坏既有分支结构。

- [ ] **Step 3: 类型 + lint 验证**

```
npx tsc --noEmit 2>&1 | grep -c "error TS"     # 期望 0
npx eslint src/components/messageRenderer/AgentMessageRenderer.tsx 2>&1; echo "exit $?"   # 期望 0(无 any)
```

- [ ] **Step 4: 提交**

```
git add src/components/messageRenderer/AgentMessageRenderer.tsx src/components/demo/demoRenderer.ts
git commit -m "feat(migrate): 生产化 AgentMessageRenderer(promote DemoMessageRenderer + View JSON)"
```

---

## Task 2: AgentChat 改用 AI Elements Conversation

**Files:**
- Modify: `src/components/home/AgentChat.tsx`

当前结构(参考):`<XProvider><Card>… {messages.length===0 ? 空态 : <Bubble.List items={messageItems}/>} … <Sender/></Card></XProvider>`,其中 `messageItems = useMessageItems(messages, { onViewJson })`。

- [ ] **Step 1: 替换消息列表渲染**

改为用 AI Elements `Conversation` + `ConversationContent`(import 自 `@/components/ai-elements/conversation`)渲染 `messages`:
- 移除 `XProvider`、`Bubble`、`useMessageItems` 的 import 与使用。
- 对每条 `message`(来自 `useChatStore` 的 `messages`):
  - `message.role === 'user'`(或 `typeof message.content === 'string'` 且非 eko):渲染 AI Elements `<Message from="user"><MessageContent>{string 内容}</MessageContent></Message>`。
  - `message.type === 'eko'` 且 content 为对象:渲染 `<AgentMessageRenderer content={message.content as StreamCallbackMessage} onViewJson={onViewJson} />`。
- 保留 `<Card>` 外壳(antd,Phase 2 再换)或直接用容器 div;保留底部 `Sender`(antd)与 loading spinner、handleSend、useSSE 全部不变。
- 空态(messages.length===0)文案保留。
- `Conversation` 需要高度上下文:确保其父容器是 `flex flex-col` 且有高度(Card body 已是 flex 列,沿用)。

> AgentMessageRenderer / Conversation / Message 的确切导出与 props 见各自源码;`/demo` 页与 PoC 已验证渲染可行。

- [ ] **Step 2: 类型 + lint**

```
npx tsc --noEmit 2>&1 | grep -c "error TS"     # 期望 0
npx eslint src/components/home/AgentChat.tsx 2>&1; echo "exit $?"   # 期望 0
```

- [ ] **Step 3: 提交**

```
git add src/components/home/AgentChat.tsx
git commit -m "feat(migrate): AgentChat 消息列表改用 AI Elements Conversation"
```

---

## Task 3: 端到端验证 + 清理被取代的 antd 渲染件

**Files:**
- Verify, then Delete(确认无引用后):`src/hooks/useMessageItems.tsx`, `src/components/messageRenderer/index.tsx`, `src/components/messageRenderer/renderers/*.tsx`, `src/components/messageRenderer/WorkflowAgentCard.tsx`

- [ ] **Step 1: 运行时验证(replay 模式渲染真实消息)**

```
pkill -f "next dev"; FORCE_COLOR=1 pnpm dev 2>&1 | tee /tmp/eko-studio-dev.log &
curl -s --retry 20 --retry-delay 1 --retry-connrefused -o /dev/null -w "GET / -> %{http_code}\n" http://localhost:3000/
```
浏览器开 http://localhost:3000,切到 Replay 模式跑一次回放(用现有 agent-log),确认:消息以 AI Elements/shadcn 渲染、各类型正常、View JSON 可点、无 console 报错(查 /tmp/eko-studio-dev.log 与浏览器 console)。controller 截图对照。

- [ ] **Step 2: 确认旧渲染件已无引用,删除**

```
grep -rnE "useMessageItems|messageRenderer/index|messageRenderer/renderers|WorkflowAgentCard|Bubble|XProvider" src --include="*.tsx" --include="*.ts" | grep -v "ai-elements" | grep -v "AgentMessageRenderer"
```
若仅剩自引用/无引用,删除上述被取代文件;若仍被引用,先改引用。删除后重跑 tsc/lint。

- [ ] **Step 3: 全量验证**

```
npx tsc --noEmit 2>&1 | grep -c "error TS"     # 0
npx eslint . >/dev/null 2>&1; echo "lint exit $?"   # 0
pnpm test 2>&1 | grep -E "Tests "               # 全绿
FORCE_COLOR=1 pnpm build 2>&1 | tail -5          # 成功
pnpm test:e2e 2>&1 | grep -aE "\[e2e\]"          # PASS(agent 后端未动,应仍通过)
```

- [ ] **Step 4: 提交**

```
git add -A
git commit -m "feat(migrate): 移除被 AI Elements 取代的 antd 消息渲染件(Phase 1 完成)"
```

---

## 完成定义(Phase 1)

- 真实 `/` 的消息渲染由 AI Elements `Conversation` + shadcn 驱动;Replay 回放各类型正确、View JSON 可用、无 console 报错。
- tsc 0、eslint 0、单测全绿、build 成功、agent e2e PASS。
- 被取代的 antd 渲染件(useMessageItems / messageRenderer renderers / index / WorkflowAgentCard)已删除且无悬挂引用。
- `Sender`、ConfigModal、Header、配置表单仍为 antd(Phase 2/3)。
- 全部在 `feat/migrate-ai-elements`;是否合并 main 由你在 Phase 检查点决定。
