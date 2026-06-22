'use client';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';
import { CodeBlock } from '@/components/ai-elements/code-block';
import type { StreamCallbackMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { AlertCircleIcon, EyeIcon } from 'lucide-react';
import type { BundledLanguage } from 'shiki';

import { resolveDemoRenderer } from '@/components/demo/demoRenderer';

// ---------------------------------------------------------------------------
// Narrow message shapes (no `any`) — mirrors the existing antd renderers
// ---------------------------------------------------------------------------

type TextMsg = {
  text?: string
};

type ThinkingMsg = {
  text?: string
  streamDone?: boolean
};

type ToolMsg = {
  toolName?: string
  toolId?: string
  params?: Record<string, unknown>
  paramsText?: string
  streamDone?: boolean
  toolResult?: {
    content?: Array<{ type: string, text: string }>
  }
};

type FileMsg = {
  mimeType?: string
  data?: string
};

type WorkflowMsg = {
  workflow?: {
    name?: string
    xml?: string
  }
};

type AgentNodeShape = {
  name?: string
  id?: string
  task?: string
  status?: string
};

type AgentMsg = {
  agentNode?: AgentNodeShape
  result?: string
  error?: unknown
};

type FinishMsg = {
  finishReason?: string
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
};

type ErrorMsg = {
  error?: unknown
};

// ---------------------------------------------------------------------------
// Branch renderers
// ---------------------------------------------------------------------------

function ResponseRenderer({ content }: { content: StreamCallbackMessage }) {
  const m = content as TextMsg;
  return (
    <Message from="assistant">
      <MessageContent>
        <MessageResponse>{m.text ?? ''}</MessageResponse>
      </MessageContent>
    </Message>
  );
}

function ReasoningRenderer({ content }: { content: StreamCallbackMessage }) {
  const m = content as ThinkingMsg;
  const isStreaming = m.streamDone === false;
  return (
    <Reasoning isStreaming={isStreaming}>
      <ReasoningTrigger />
      <ReasoningContent>{m.text ?? ''}</ReasoningContent>
    </Reasoning>
  );
}

function ToolRenderer({ content }: { content: StreamCallbackMessage }) {
  const m = content as ToolMsg;

  // Unify params → input object, avoiding mutation of const
  let input: Record<string, unknown> = m.params ?? {};
  if (!m.params && m.paramsText) {
    try {
      const parsed: unknown = JSON.parse(m.paramsText);
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        input = parsed as Record<string, unknown>;
      }
      else {
        input = { raw: m.paramsText };
      }
    }
    catch {
      input = { raw: m.paramsText };
    }
  }

  // Collect output text from toolResult. NOTE: only text-type results are shown;
  // image-type tool results (toolResult.content[].type === 'image') are skipped
  // here — see PoC findings (AI Elements ToolOutput is text/JSON oriented).
  const outputText = m.toolResult?.content
    ?.filter(c => c.type === 'text')
    .map(c => c.text)
    .join('\n');

  // Map our flags to AI Elements' ToolUIPart state enum:
  // tool_streaming (streamDone === false) -> input-streaming;
  // tool_result (has outputText)          -> output-available;
  // tool_use (no result yet)              -> input-available.
  const toolState: 'input-streaming' | 'input-available' | 'output-available'
    = m.streamDone === false
      ? 'input-streaming'
      : outputText
        ? 'output-available'
        : 'input-available';

  return (
    <Tool>
      <ToolHeader
        state={toolState}
        title={m.toolName}
        toolName={m.toolName ?? 'unknown'}
        type="dynamic-tool"
      />
      <ToolContent>
        <ToolInput input={input} />
        {outputText && (
          <ToolOutput errorText={undefined} output={outputText} />
        )}
      </ToolContent>
    </Tool>
  );
}

function FileRenderer({ content }: { content: StreamCallbackMessage }) {
  const m = content as FileMsg;
  const mimeType = m.mimeType ?? '';
  const data = m.data ?? '';

  if (mimeType.startsWith('image/')) {
    // AI Elements Image expects { base64, mediaType } — field names differ from
    // our { data (base64), mimeType }. Render img directly (CUSTOM wiring).
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt="file preview"
        className="h-auto max-w-full overflow-hidden rounded-md"
        src={`data:${mimeType};base64,${data}`}
      />
    );
  }

  // Non-image: decode base64 and show in a CodeBlock.
  // atob yields a Latin-1 binary string; reinterpret the bytes as UTF-8 so
  // multi-byte characters (e.g. an em dash) don't turn into mojibake.
  let decoded = '';
  try {
    const binary = atob(data);
    decoded = new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0)));
  }
  catch {
    decoded = data;
  }

  const language = (
    mimeType.includes('json')
      ? 'json'
      : mimeType.includes('xml')
        ? 'xml'
        : 'text'
  ) as BundledLanguage;

  return <CodeBlock code={decoded} language={language} />;
}

function WorkflowRenderer({ content }: { content: StreamCallbackMessage }) {
  const m = content as WorkflowMsg;
  const xml = m.workflow?.xml ?? '';
  const name = m.workflow?.name;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Workflow
          {name ? `: ${name}` : ''}
        </CardTitle>
      </CardHeader>
      {xml && (
        <CardContent>
          <CodeBlock code={xml} language="xml" />
        </CardContent>
      )}
    </Card>
  );
}

function AgentRenderer({ content }: { content: StreamCallbackMessage }) {
  // AI Elements agent.tsx is built for AI SDK Tool[] — does not match WorkflowAgent.
  // Using shadcn Card (CUSTOM wiring).
  const m = content as AgentMsg;
  const node = m.agentNode;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {'Agent: '}
          {node?.name ?? 'unknown'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        {node?.id && (
          <p>
            <span className="font-medium text-muted-foreground">
              ID:
            </span>
            {' '}
            <code>{node.id}</code>
          </p>
        )}
        {node?.status && (
          <p>
            <span className="font-medium text-muted-foreground">
              Status:
            </span>
            {' '}
            {node.status}
          </p>
        )}
        {node?.task && (
          <p>
            <span className="font-medium text-muted-foreground">
              Task:
            </span>
            {' '}
            {node.task}
          </p>
        )}
        {m.result && (
          <p>
            <span className="font-medium text-muted-foreground">
              Result:
            </span>
            {' '}
            {m.result}
          </p>
        )}
        {m.error != null && (
          <p className="text-destructive">
            <span className="font-medium">Error:</span>
            {' '}
            {typeof m.error === 'string' ? m.error : JSON.stringify(m.error)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function FinishRenderer({ content }: { content: StreamCallbackMessage }) {
  const m = content as FinishMsg;
  const usage = m.usage;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Finished
          {m.finishReason ? ` (${m.finishReason})` : ''}
        </CardTitle>
      </CardHeader>
      {usage && (
        <CardContent className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="text-muted-foreground">Prompt</p>
            <p className="font-mono font-semibold">{usage.promptTokens ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Completion</p>
            <p className="font-mono font-semibold">{usage.completionTokens ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total</p>
            <p className="font-mono font-semibold">{usage.totalTokens ?? '—'}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function ErrorRenderer({ content }: { content: StreamCallbackMessage }) {
  const m = content as ErrorMsg;
  let message: string;

  if (m.error == null) {
    message = 'Unknown error';
  }
  else if (typeof m.error === 'string') {
    message = m.error;
  }
  else if (m.error instanceof Error) {
    message = m.error.message;
  }
  else {
    message = JSON.stringify(m.error, null, 2);
  }

  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function FallbackRenderer({ content }: { content: StreamCallbackMessage }) {
  const typed = content as { type?: string };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {'Unknown message type: '}
          {typed.type ?? 'undefined'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="overflow-x-auto whitespace-pre-wrap text-xs">
          {JSON.stringify(content, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------

export interface AgentMessageRendererProps {
  content: StreamCallbackMessage
  onViewJson?: (content: StreamCallbackMessage) => void
}

function renderByKind(
  kind: ReturnType<typeof resolveDemoRenderer>,
  content: StreamCallbackMessage,
) {
  switch (kind) {
    case 'response':
      return <ResponseRenderer content={content} />;
    case 'reasoning':
      return <ReasoningRenderer content={content} />;
    case 'tool':
      return <ToolRenderer content={content} />;
    case 'file':
      return <FileRenderer content={content} />;
    case 'workflow':
      return <WorkflowRenderer content={content} />;
    case 'agent':
      return <AgentRenderer content={content} />;
    case 'finish':
      return <FinishRenderer content={content} />;
    case 'error':
      return <ErrorRenderer content={content} />;
    case 'fallback':
      return <FallbackRenderer content={content} />;
  }
}

export function AgentMessageRenderer({ content, onViewJson }: AgentMessageRendererProps) {
  const typed = content as { type?: string };
  const kind = resolveDemoRenderer(typed.type);

  return (
    <div className="group relative">
      {onViewJson && (
        <Button
          aria-label="View JSON"
          className="absolute right-1 top-1 z-10 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => onViewJson(content)}
          size="sm"
          variant="ghost"
        >
          <EyeIcon className="size-4" />
        </Button>
      )}
      {renderByKind(kind, content)}
    </div>
  );
}
