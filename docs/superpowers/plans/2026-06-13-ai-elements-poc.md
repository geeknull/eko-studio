# AI Elements 迁移 PoC 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有项目中搭一个隔离的 `/demo` 页,用 shadcn/ui + Vercel AI Elements 渲染录制日志里的真实 `StreamCallbackMessage` 样本,量出"换皮"成本与共存风险,产出 go/no-go 评估。

**Architecture:** 方案 C —— 沿用现有"按 message.type 策略分发"的渲染结构,只把 antd 视觉件换成 AI Elements/shadcn 视觉件。后端 eko + SSE 不动;数据用从 `agent-log/` 抽取并固化的静态样本;`/demo` 路由自带最小 layout 以隔离全局样式冲突。

**Tech Stack:** Next 16 (App Router) · React 19 · Tailwind 4 · shadcn/ui · Vercel AI Elements · Vitest · pnpm

> **PoC 说明(给执行者):** 本计划含**内建探索** —— shadcn/ai-elements 的 CLI 行为与组件 prop API 以"安装后读源码确认"为准。涉及 AI Elements 组件 props 的步骤,实现时**先打开 `src/components/ai-elements/<组件>.tsx` 读其导出与 props**,再按本计划的数据映射填入。每个 Task 结束都跑 `npx tsc --noEmit` 与 `pnpm lint` 并提交。

---

## 文件结构

由 CLI 生成 / 修改:
- `components.json`(shadcn init 创建)
- `src/lib/utils.ts`(shadcn init 创建,含 `cn()`)
- `src/app/globals.css`(shadcn init 追加 CSS 变量与 base 层)
- `src/components/ai-elements/*`(ai-elements CLI 安装,进仓库可改)
- `src/components/ui/*`(按需 `shadcn add` 的原语,如 `card`、`alert`)

本计划手写:
- `scripts/extract-demo-samples.ts` —— 一次性抽样脚本(复用 `LogPlayer.parseLogFile`)
- `src/components/demo/sample-messages.ts` —— 抽样产物(提交,确定性)
- `src/components/demo/demoRenderer.ts` —— 纯分发函数 `resolveDemoRenderer(type)`
- `src/components/demo/demoRenderer.test.ts` —— 分发函数单测
- `src/components/demo/DemoMessageRenderer.tsx` —— 按 type 的 React 渲染器
- `src/app/demo/layout.tsx` —— `/demo` 最小 layout
- `src/app/demo/page.tsx` —— demo 页
- `docs/superpowers/specs/2026-06-13-ai-elements-poc-findings.md` —— 交付评估文档

---

## Task 1: shadcn/ui 初始化 + 共存基线

**Files:**
- Create: `components.json`, `src/lib/utils.ts`
- Modify: `src/app/globals.css`, `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: 记录共存基线**

启动 dev,确认首页当前正常(作为后续对照):
```bash
FORCE_COLOR=1 pnpm dev 2>&1 | tee /tmp/eko-studio-dev.log &
sleep 6
curl -s -o /dev/null -w "GET / -> %{http_code}\n" http://localhost:3000/
```
Expected: `GET / -> 200`。在浏览器打开 http://localhost:3000 记下 antd 首页当前外观(布局、按钮/卡片样式),供 Step 4 对照。

- [ ] **Step 2: 运行 shadcn init(Tailwind 4)**

```bash
pnpm dlx shadcn@latest init -d -b neutral
```
若有交互提示:TypeScript=yes、style=默认、CSS variables=yes、接受对 `globals.css` 的修改。
Expected: 生成 `components.json` 与 `src/lib/utils.ts`,`globals.css` 追加 `:root`/`@theme` CSS 变量与 base 层;`package.json` 增加 `clsx`/`tailwind-merge`/`class-variance-authority` 等。

- [ ] **Step 3: 确认生成物**

```bash
cat components.json | head -20
test -f src/lib/utils.ts && grep -n "export function cn" src/lib/utils.ts
grep -nE "tailwind|:root|--background|@theme" src/app/globals.css | head
```
Expected: `components.json` 存在且 `tailwind`/`aliases` 配置合理;`cn()` 已导出;`globals.css` 含 shadcn CSS 变量。

- [ ] **Step 4: 共存验证 —— 首页不能被搞坏(关键)**

```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"   # 期望 0
FORCE_COLOR=1 pnpm build 2>&1 | tail -5        # 期望成功
```
重启 dev,浏览器重新打开 http://localhost:3000,与 Step 1 记录对照:**antd 首页布局/组件样式无明显回归**(重点:Tailwind preflight / shadcn base 是否覆盖了 antd 的 reset 导致按钮、卡片、间距错乱)。
- 若有回归:记录现象;在 `globals.css` 中把 shadcn 的 base 层用 `@layer` 约束,或将首页排除在 preflight 影响外(把发现写进 Task 7 的 findings,作为"共存成本")。
Expected: tsc 0、build 成功、首页可接受。

- [ ] **Step 5: 提交**

```bash
git add components.json src/lib/utils.ts src/app/globals.css package.json pnpm-lock.yaml
git commit -m "poc(ai-elements): init shadcn/ui (Tailwind 4)"
```

---

## Task 2: 安装 AI Elements 组件

**Files:**
- Create: `src/components/ai-elements/*`, 可能新增 `src/components/ui/*`
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: 查看可用组件并安装所需子集**

```bash
pnpm dlx ai-elements@latest add conversation message response reasoning tool code-block image
```
若某组件名不存在,先列出可用项再调整:
```bash
pnpm dlx ai-elements@latest --help
```
Expected: 组件文件落到 `src/components/ai-elements/`;可能自动 `shadcn add` 依赖的 ui 原语(collapsible 等)并加 `ai` / `@ai-sdk/react` 等依赖。

- [ ] **Step 2: 确认安装产物**

```bash
ls src/components/ai-elements/
```
Expected: 出现 conversation / message / response / reasoning / tool / code-block / image 对应文件。

- [ ] **Step 3: 读组件 API(为 Task 5 做准备)**

打开并通读以下文件,记下每个组件的**导出名与 props**(后续 Task 5 直接按这些写):
- `src/components/ai-elements/conversation.tsx`
- `src/components/ai-elements/message.tsx`
- `src/components/ai-elements/response.tsx`
- `src/components/ai-elements/reasoning.tsx`
- `src/components/ai-elements/tool.tsx`
- `src/components/ai-elements/code-block.tsx`

无命令产出,仅阅读;把关键 props 记在 Task 7 findings 草稿里。

- [ ] **Step 4: 类型/构建验证 + 提交**

```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"   # 期望 0
git add src/components package.json pnpm-lock.yaml components.json
git commit -m "poc(ai-elements): install AI Elements components"
```

---

## Task 3: 抽取真实样本消息

**Files:**
- Create: `scripts/extract-demo-samples.ts`, `src/components/demo/sample-messages.ts`

- [ ] **Step 1: 写抽样脚本(复用 LogPlayer)**

Create `scripts/extract-demo-samples.ts`:
```ts
import * as fs from 'fs';
import * as path from 'path';
import { LogPlayer } from '../src/agent/logger/LogPlayer';

// 取最新的一个 agent-log 文件
const dir = path.join(process.cwd(), 'agent-log');
const file = fs.readdirSync(dir)
  .filter(f => f.endsWith('.log'))
  .map(f => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
  .sort((a, b) => b.t - a.t)[0]?.f;
if (!file) throw new Error('no agent-log found');

const entries = new LogPlayer({ logFilePath: path.join(dir, file) }).parseLogFile();

// 每种 type 取第一条 message
const byType = new Map<string, unknown>();
for (const e of entries) {
  const m = e.message as { type?: string };
  if (m && typeof m.type === 'string' && !byType.has(m.type)) {
    byType.set(m.type, m);
  }
}

const samples = Object.fromEntries(byType);
const out = path.join(process.cwd(), 'src/components/demo/sample-messages.ts');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(
  out,
  '// AUTO-GENERATED by scripts/extract-demo-samples.ts — real recorded samples, one per type.\n'
  + 'import type { StreamCallbackMessage } from \'@/types\';\n\n'
  + 'export const SAMPLE_MESSAGES: StreamCallbackMessage[] = '
  + JSON.stringify(Object.values(samples), null, 2)
  + ' as unknown as StreamCallbackMessage[];\n',
);
console.log('Wrote', Object.keys(samples).length, 'sample types:', Object.keys(samples).join(', '));
```

- [ ] **Step 2: 运行脚本生成样本**

```bash
pnpm dlx tsx scripts/extract-demo-samples.ts
```
Expected: 打印类似 `Wrote 8 sample types: workflow, thinking, text, tool_streaming, tool_use, tool_result, finish, agent_start ...`,并生成 `src/components/demo/sample-messages.ts`。

- [ ] **Step 3: 确认样本覆盖**

```bash
grep -oE '"type": "[a-z_]+"' src/components/demo/sample-messages.ts | sort -u
npx tsc --noEmit 2>&1 | grep -c "error TS"   # 期望 0
```
Expected: 覆盖 workflow / thinking / text / tool_* / finish / agent_start / agent_result 等;tsc 0。

- [ ] **Step 4: 提交**

```bash
git add scripts/extract-demo-samples.ts src/components/demo/sample-messages.ts
git commit -m "poc(ai-elements): extract real sample messages from agent-log"
```

---

## Task 4: 类型→渲染分发函数(TDD)

**Files:**
- Create: `src/components/demo/demoRenderer.ts`, `src/components/demo/demoRenderer.test.ts`

- [ ] **Step 1: 写失败测试**

Create `src/components/demo/demoRenderer.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { resolveDemoRenderer } from './demoRenderer';

describe('resolveDemoRenderer', () => {
  it('maps text/normal to response', () => {
    expect(resolveDemoRenderer('text')).toBe('response');
    expect(resolveDemoRenderer('normal')).toBe('response');
  });
  it('maps thinking to reasoning', () => {
    expect(resolveDemoRenderer('thinking')).toBe('reasoning');
  });
  it('maps every tool_* to tool', () => {
    expect(resolveDemoRenderer('tool_streaming')).toBe('tool');
    expect(resolveDemoRenderer('tool_use')).toBe('tool');
    expect(resolveDemoRenderer('tool_result')).toBe('tool');
  });
  it('maps file to file', () => {
    expect(resolveDemoRenderer('file')).toBe('file');
  });
  it('maps workflow/agent_start/agent_result/finish/error to their custom kinds', () => {
    expect(resolveDemoRenderer('workflow')).toBe('workflow');
    expect(resolveDemoRenderer('agent_start')).toBe('agent');
    expect(resolveDemoRenderer('agent_result')).toBe('agent');
    expect(resolveDemoRenderer('finish')).toBe('finish');
    expect(resolveDemoRenderer('error')).toBe('error');
  });
  it('falls back for unknown types', () => {
    expect(resolveDemoRenderer('something_new')).toBe('fallback');
  });
});
```

- [ ] **Step 2: 运行测试,确认失败**

```bash
pnpm test -- demoRenderer 2>&1 | tail -10
```
Expected: FAIL（`resolveDemoRenderer` 未定义 / 模块不存在）。

- [ ] **Step 3: 写最小实现**

Create `src/components/demo/demoRenderer.ts`:
```ts
export type DemoRendererKind
  = 'response' | 'reasoning' | 'tool' | 'file'
    | 'workflow' | 'agent' | 'finish' | 'error' | 'fallback';

export function resolveDemoRenderer(type: string | undefined): DemoRendererKind {
  switch (type) {
    case 'text':
    case 'normal':
      return 'response';
    case 'thinking':
      return 'reasoning';
    case 'tool_streaming':
    case 'tool_use':
    case 'tool_result':
    case 'tool_running':
      return 'tool';
    case 'file':
      return 'file';
    case 'workflow':
      return 'workflow';
    case 'agent_start':
    case 'agent_result':
      return 'agent';
    case 'finish':
      return 'finish';
    case 'error':
      return 'error';
    default:
      return 'fallback';
  }
}
```

- [ ] **Step 4: 运行测试,确认通过**

```bash
pnpm test -- demoRenderer 2>&1 | tail -6
```
Expected: PASS（全部断言通过）。

- [ ] **Step 5: 提交**

```bash
git add src/components/demo/demoRenderer.ts src/components/demo/demoRenderer.test.ts
git commit -m "poc(ai-elements): type->renderer dispatch (TDD)"
```

---

## Task 5: DemoMessageRenderer 组件

**Files:**
- Create: `src/components/demo/DemoMessageRenderer.tsx`
- 可能 Create: `src/components/ui/card.tsx`, `src/components/ui/alert.tsx`（若 Task 2 未带入则 `pnpm dlx shadcn@latest add card alert`)

> 实现前先确认 Task 2 Step 3 记下的 AI Elements props。下方 JSX 为意图示例,**导出名/props 以安装到 `src/components/ai-elements/` 的实际文件为准**,实现时据此调整。

- [ ] **Step 1: 按需补 shadcn 原语**

```bash
pnpm dlx shadcn@latest add card alert
```
Expected: 生成 `src/components/ui/card.tsx`、`src/components/ui/alert.tsx`(已存在则跳过)。

- [ ] **Step 2: 写渲染器**

Create `src/components/demo/DemoMessageRenderer.tsx`。按 `resolveDemoRenderer(content.type)` 分发,每种 kind 对应:
- `response` → AI Elements `<Message from="assistant">` + `<Response>{content.text ?? content.streamText}</Response>`
- `reasoning` → `<Reasoning>` 包 `content.text`(思考流)
- `tool` → `<Tool>`(ToolHeader 显示 `content.toolName`;输入用 `content.params ?? content.paramsText`;输出用 `content.toolResult`)
- `file` → 图片类型用 `<Image>`,文本/代码用 `<CodeBlock>`(base64 解码,参考现有 `FileRenderer`)
- `workflow` → shadcn `<Card>` 标题 "Workflow",正文用 `<CodeBlock language="xml">{content.workflow?.xml}</CodeBlock>`
- `agent` → shadcn `<Card>` 显示 `content.agentNode`(name/status/task)
- `finish` → shadcn `<Card>` 显示 token 统计(`content.usage`,参考现有 `FinishRenderer`)
- `error` → shadcn `<Alert variant="destructive">` 显示 `content.error`
- `fallback` → shadcn `<Card>` 内 `<pre>{JSON.stringify(content, null, 2)}</pre>`

类型处理:`content` 为 `StreamCallbackMessage`;对联合外字段(如 `text`/`workflow`/`toolResult`)用窄化的局部类型断言(参考现有 renderer 的 `as` 用法,**不要用 `any`**,以过 lint)。组件不接 store、纯 props 渲染。

- [ ] **Step 3: 类型 + lint 验证**

```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"   # 期望 0
npx eslint src/components/demo/DemoMessageRenderer.tsx 2>&1; echo "exit $?"  # 期望 exit 0
```
Expected: tsc 0、eslint exit 0(若报 `no-explicit-any` 等,改成具体窄化类型)。

- [ ] **Step 4: 提交**

```bash
git add src/components/demo src/components/ui
git commit -m "poc(ai-elements): DemoMessageRenderer mapping StreamCallbackMessage -> AI Elements"
```

---

## Task 6: /demo 路由与页面

**Files:**
- Create: `src/app/demo/layout.tsx`, `src/app/demo/page.tsx`

- [ ] **Step 1: 写最小 layout(隔离全局样式)**

Create `src/app/demo/layout.tsx`:
```tsx
import type { ReactNode } from 'react';

export default function DemoLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-3xl p-6">{children}</div>;
}
```

- [ ] **Step 2: 写 demo 页**

Create `src/app/demo/page.tsx`(用 Conversation 容器包样本;`'use client'` 因组件含交互):
```tsx
'use client';

import { Conversation, ConversationContent } from '@/components/ai-elements/conversation';
import { DemoMessageRenderer } from '@/components/demo/DemoMessageRenderer';
import { SAMPLE_MESSAGES } from '@/components/demo/sample-messages';

export default function DemoPage() {
  return (
    <Conversation>
      <ConversationContent>
        {SAMPLE_MESSAGES.map((m, i) => (
          <DemoMessageRenderer key={i} content={m} />
        ))}
      </ConversationContent>
    </Conversation>
  );
}
```
> Conversation 的导出名/子组件以 `src/components/ai-elements/conversation.tsx` 实际为准,据此微调。

- [ ] **Step 3: 验证渲染**

```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"   # 期望 0
# dev 已起则直接访问;否则 FORCE_COLOR=1 pnpm dev 2>&1 | tee /tmp/eko-studio-dev.log &
curl -s -o /dev/null -w "GET /demo -> %{http_code}\n" http://localhost:3000/demo
```
浏览器打开 http://localhost:3000/demo,确认 8 类消息都渲染、无 React 报错(看 /tmp/eko-studio-dev.log 与浏览器 console);截图备用。
Expected: `GET /demo -> 200`,各类型可见,缺口项(workflow/agent/finish/error)以 Card/Alert 呈现。

- [ ] **Step 4: 提交**

```bash
git add src/app/demo
git commit -m "poc(ai-elements): /demo route rendering recorded samples"
```

---

## Task 7: 共存验证 + 交付评估文档

**Files:**
- Create: `docs/superpowers/specs/2026-06-13-ai-elements-poc-findings.md`

- [ ] **Step 1: 全量验证**

```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"   # 期望 0
npx eslint . >/dev/null 2>&1; echo "lint exit $?"   # 期望 0
pnpm test 2>&1 | grep -E "Tests "             # 期望全绿(含新 demoRenderer 测试)
FORCE_COLOR=1 pnpm build 2>&1 | tail -5        # 期望成功
```

- [ ] **Step 2: 共存对照**

浏览器分别打开 `/`(antd)与 `/demo`(AI Elements),对照 Task 1 Step 1 的基线:确认首页**无视觉回归**,demo 页正常。记录任何冲突与所用对策。

- [ ] **Step 3: 写 findings 文档**

Create `docs/superpowers/specs/2026-06-13-ai-elements-poc-findings.md`,包含:
1. **逐类型映射结果表**:type → 用了哪个组件 → 干净/需自定义/缺口 → 实现代码量(行数级别)。
2. **shadcn + antd 共存结论**:有无冲突(Tailwind preflight vs antd reset)、对策、首页是否受影响。
3. **全量迁移工作量估算**:统计 antd 在仓库的使用面(`grep -rn "from 'antd'" src | wc -l`、涉及文件数;ConfigModal / 各 MessageRenderer / JsonViewModal / 布局),按"组件类别 × 出现处"估算改造量。
4. **go/no-go 建议**:是否值得全量迁移;若迁,建议节奏(增量 module-by-module)与先后顺序。

- [ ] **Step 4: 提交**

```bash
git add docs/superpowers/specs/2026-06-13-ai-elements-poc-findings.md
git commit -m "poc(ai-elements): findings + full-migration estimate"
```

---

## 完成定义(PoC)

- tsc 0、eslint exit 0、`pnpm test` 全绿、`pnpm build` 成功。
- 首页 `/`(antd)无视觉回归;`/demo` 渲染全部样本类型。
- findings 文档产出,含逐类型映射结果、共存结论、全量迁移工作量估算与 go/no-go 建议。
- 全部工作在分支 `poc/ai-elements`;是否合并由 PoC 结论与用户决定(本 PoC 不自动合并、不动现有 `/` 主流程)。
