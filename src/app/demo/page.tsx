'use client';

import { useSyncExternalStore } from 'react';
import { AgentMessageRenderer } from '@/components/messageRenderer/AgentMessageRenderer';
import {
  type DemoRendererKind,
  resolveDemoRenderer,
} from '@/components/demo/demoRenderer';
import { SAMPLE_MESSAGES } from '@/components/demo/sample-messages';
import { SYNTHETIC_SAMPLES } from '@/components/demo/synthetic-samples';
import type { StreamCallbackMessage } from '@/types';

// Real recorded samples (from agent-log) + synthetic file/error samples, used as
// the source pool for one representative example per card type below.
const ALL_SAMPLES = [...SAMPLE_MESSAGES, ...SYNTHETIC_SAMPLES];

// Catalog: each card type gets a title + one-line description so viewers know
// what they're looking at. Order = rough order things appear in a run.
const CARD_CATALOG: { kind: DemoRendererKind, title: string, description: string }[] = [
  { kind: 'workflow', title: 'Workflow · 工作流', description: '工作流定义(XML),shiki 语法高亮' },
  { kind: 'reasoning', title: 'Reasoning · 思考过程', description: '可折叠的思考链;流式输出时自动展开' },
  { kind: 'tool', title: 'Tool · 工具调用', description: '工具名 + 状态(运行中 / 已完成)+ 入参 / 出参,可展开' },
  { kind: 'agent', title: 'Agent · 节点', description: 'Agent 节点:ID / 状态 / 任务 / 结果' },
  { kind: 'response', title: 'Response · 文本回复', description: 'Agent 的文本回复,markdown 渲染(streamdown)' },
  { kind: 'finish', title: 'Finished · 完成与用量', description: '运行结束:结束原因 + token 用量统计' },
  { kind: 'file', title: 'File · 文件', description: '图片直接预览;其它类型 base64 解码为代码块' },
  { kind: 'error', title: 'Error · 错误', description: '错误提示(红色 destructive Alert)' },
];

// Prefer a content-bearing sample so each example actually shows something
// (the first sample of a kind can be an empty/partial streaming frame).
function hasContent(kind: DemoRendererKind, m: StreamCallbackMessage): boolean {
  const a = m as Record<string, unknown>;
  switch (kind) {
    case 'response':
    case 'reasoning':
      return typeof a.text === 'string' && a.text.trim().length > 0;
    case 'tool':
      return a.toolResult != null; // completed tool — shows input + output
    case 'workflow':
      return Boolean((a.workflow as { xml?: string } | undefined)?.xml);
    case 'agent':
      return a.result != null; // completed agent — shows the result
    default:
      return true;
  }
}

// Pick a representative sample for a card type (content-bearing if possible).
function representative(kind: DemoRendererKind): StreamCallbackMessage | undefined {
  const ofKind = ALL_SAMPLES.filter(
    m => resolveDemoRenderer((m as { type?: string }).type) === kind,
  );
  return ofKind.find(m => hasContent(kind, m)) ?? ofKind[0];
}

export default function DemoPage() {
  // Render the gallery only after hydration. Card examples contain shiki code
  // blocks whose SSR colors don't match the client's first paint — skipping SSR
  // of the tree avoids that hydration mismatch (this is a client-side preview).
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <>
      <h1 className="text-lg font-semibold">
        Message card gallery · 消息卡片预览
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        eko 消息渲染层支持的各类卡片,每节是一种类型的代表示例,通过真实的
        {' '}
        <code className="text-xs">AgentMessageRenderer</code>
        {' '}
        渲染(与正式聊天界面完全一致)。
      </p>

      {hydrated && (
        <div className="space-y-8">
          {CARD_CATALOG.map(({ kind, title, description }) => {
            const sample = representative(kind);
            if (!sample) return null;
            return (
              <section className="space-y-2" key={kind}>
                <div>
                  <h2 className="text-base font-semibold">{title}</h2>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-4">
                  <AgentMessageRenderer content={sample} />
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
