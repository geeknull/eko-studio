# Eko Studio Development Guide

This document integrates development instructions for various modules of the project, aiming to help developers quickly understand the project structure and development specifications.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Type System (Types)](#type-system-types)
3. [State Management (Store)](#state-management-store)
4. [React Hooks](#react-hooks)
5. [Component Architecture](#component-architecture)
    - [Base Components (Base)](#base-components-base)
    - [Common Business Components (Common)](#common-business-components-common)
    - [Message Rendering System (MessageRenderer)](#message-rendering-system-messagerenderer)
6. [Backend API](#backend-api)

---

## Project Overview

Eko Studio is a Next.js-based AI Agent visualization and debugging platform.

### Core Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **UI Component Library**: Ant Design 5.x + @ant-design/x (AI dedicated components)
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Language**: TypeScript

---

## Type System (Types)

Located in the `types/` directory, containing all core type definitions for the project.

### File Structure

```
types/
├── index.ts        # Unified export of all types
├── agent.ts        # Eko Agent core types (formerly eko.ts)
└── sse.ts          # SSE communication related types
```

### Usage Guidelines

It is recommended to import uniformly via `types/index.ts`:

```typescript
import { StreamCallbackMessage, WorkflowAgent } from '@/types'
```

### Core Type Descriptions

#### agent.ts (Agent Core Types)

Contains core data structures for interacting with backend Agents:

- `StreamCallbackMessage`: Union type for streaming callback messages, covering various states like `workflow`, `agent_start`, `text`, `tool_use`, `finish`, etc.
- `Workflow`: Workflow definition.
- `WorkflowAgent`: Definition of a single Agent.

#### sse.ts (SSE Event Types)

Defines the event format for communication between the frontend and the SSE server:

- `SseEventData`: Union type of all SSE events.
- `AgentMessageEvent`: Business message event containing `StreamCallbackMessage`.

---

## State Management (Store)

Located in the `store/` directory, using Zustand for lightweight global state management.

### chatStore.ts

The core Store managing the chat session.

**Main Functions**:
- Message list management (`messages`)
- Streaming status (`isLoading`, `currentStreamingId`)
- Message appending and updating
- **Debugging Tips**: In development mode, you can access and manipulate the state directly in the console via `window.chatStore`.

### messageMerger.ts

Responsible for handling message merging logic. Due to the nature of SSE streaming, continuous messages from the same Agent or updates to the same task need to be merged for display to avoid excessive messages in the interface.

---

## React Hooks

Located in the `hooks/` directory, encapsulating general logic.

### useSSE

Custom Hook for handling Server-Sent Events connections.

```typescript
const { isConnected, connect, disconnect } = useSSE({
  url: '/api/sse',
  onConnect: () => console.log('Connected'),
  // ...
})
```

**Features**:
- Automatically handles connection lifecycle
- Supports heartbeat detection and automatic reconnection
- Parses SSE event streams

### useMessageItems

Converts the message list in `chatStore` into the format required by UI components (`Bubble.List`).

- Handles message rendering logic (text vs custom renderers)
- Generates message metadata (sequence number, repeat count)
- Handles interactions like "View JSON"

---

## Component Architecture

Components are located in the `components/` directory, adopting a layered architecture design.

### Directory Structure

```
components/
├── base/            # Pure UI components (no business logic)
├── common/          # Common business components (with business logic)
└── MessageRenderer/ # Message rendering dedicated system
```

### Base Components (Base)

Located in `components/base/`.
**Principles**: Pure UI, side-effect-free, highly generic.

- **LazySyntaxHighlighter**: Code highlighting component, supporting lazy loading for performance optimization.
- **MarkdownRenderer**: GFM-supported Markdown renderer for displaying AI responses.
- **JsonViewModal**: Generic JSON data viewing modal.

### Common Business Components (Common)

Located in `components/common/`.
**Principles**: Contains project-specific business logic, reusable.

- **WorkflowAgentCard**: Card component specifically for rendering `WorkflowAgent` objects, displaying Agent status, dependencies, and node information.

### Message Rendering System (MessageRenderer)

Located in `components/MessageRenderer/`.
**Principles**: Strategy pattern, dispatching to different sub-renderers based on message type (`StreamCallbackMessage.type`).

**Renderer List (renderers/)**:

- **WorkflowRenderer**: Renders workflow graphs and XML definitions.
- **AgentStartRenderer / AgentResultRenderer**: Renders Agent start and execution results (reuses `WorkflowAgentCard`).
- **ThinkingRenderer**: Renders AI thinking process (`thinking`) and text response (`text`).
- **ToolRenderer**: Renders tool invocation flow (`tool_streaming` -> `tool_running` -> `tool_result`).
- **FileRenderer**: Renders generated files (images, code, etc.).
- **ErrorRenderer**: Renders error stacks.
- **FinishRenderer**: Renders task completion status and Token statistics.

---

## Backend API

Located in the `app/api/` directory.

### Agent API

- **Path**: `/api/agent`
- **Features**:
    - `/start`: Starts a new Agent task, returns `taskId`.
    - `/stream/[taskId]`: SSE-based streaming output interface, frontend receives real-time updates by connecting to this interface via `useSSE`.

---

*This document is automatically generated and organized by development tools. If you need to modify the documentation for each module, please update this document directly.*
