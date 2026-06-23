# Eko Studio

基于 [Eko](https://github.com/FellouAI/eko) 的 AI Agent 可视化与调试平台。前端用 Next.js + AI Elements + shadcn/ui 实时渲染 Agent 的工作流、思考、工具调用与结果;既能作为 Web 应用运行,也打包成 Electron 桌面应用(内置浏览器自动化能力)。

> 更详细的代码结构与组件约定见 [DEVELOPMENT.md](./DEVELOPMENT.md)。

## 技术栈

- **框架**:Next.js 16 (App Router) + React 19
- **UI**:[Vercel AI Elements](https://elements.ai-sdk.dev) + [shadcn/ui](https://ui.shadcn.com)(Radix 地基)+ Tailwind CSS;暗色模式用 next-themes(Header 手动切换)
- **表单**:react-hook-form + zod
- **状态**:Zustand
- **Agent**:[@eko-ai/eko](https://www.npmjs.com/package/@eko-ai/eko) + [@eko-ai/eko-nodejs](https://www.npmjs.com/package/@eko-ai/eko-nodejs)(BrowserAgent,基于 Playwright)
- **桌面端**:Electron(生产模式内嵌 Next.js standalone server)
- **测试**:Vitest(单元) + tsx 脚本(e2e)

## 运行模式

应用有两种模式(见 `src/store/configStore.ts`):

- **replay(默认)**:回放已录制的日志,不调用 LLM,无需任何 key,适合调试 UI 渲染。
- **normal**:真实运行 Agent,需要配置 LLM。

## 快速开始

前置:Node.js ≥ 20、pnpm。

```bash
# 1. 安装依赖
pnpm install

# 2. 安装 Playwright Chromium(BrowserAgent 需要)
pnpm init

# 3. 配置环境变量
cp _env.example .env
#   编辑 .env,至少填入 OPENROUTER_API_KEY

# 4. 启动开发服务器
pnpm dev
```

打开 http://localhost:3000。

## 环境变量

**代码的默认兜底配置只读取 `OPENROUTER_*`**(见 `src/agent/index.ts`):

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | 是 | OpenRouter API Key,默认 LLM 凭证 |
| `OPENROUTER_BASE_URL` | 否 | 默认 `https://openrouter.ai/api/v1` |
| `OPENROUTER_MODEL` | 否 | 默认模型,缺省 `openai/gpt-5-nano`(便宜、支持图像 + 工具调用,适合测试) |

> `_env.example` 里还列了 `ANTHROPIC_*` / `OPENAI_*`,但**默认运行路径不读取它们**。要使用 Anthropic / OpenAI / Google / Bedrock / Azure 等其他 provider,请在界面的配置弹窗(ConfigModal)里选择并填入 apiKey —— 这些会以 `normalConfig` 通过 API 直接传给后端,优先级高于环境变量兜底。

`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 仅在 Electron 生产环境由主进程自动设置,指向打包内置的 Chromium,无需手动配置。

## 常用脚本

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 启动 Next.js 开发服务器 |
| `pnpm dev:electron` | 同时启动 Next dev 与 Electron 窗口 |
| `pnpm build` | 生产构建(已开启 TypeScript 类型检查) |
| `pnpm start` | 启动生产服务器 |
| `pnpm lint` | ESLint 检查 |
| `pnpm test` | 运行单元测试(Vitest,快速、无网络) |
| `pnpm test:watch` | 单元测试 watch 模式 |
| `pnpm test:e2e` | 确定性真实 Agent 端到端冒烟(需 `OPENROUTER_API_KEY`) |
| `pnpm init` | 安装 Playwright Chromium |
| `pnpm agent:test` | 本地直跑 Agent 的演示脚本(默认"总结今日新闻") |

## 测试

- **单元测试** `pnpm test`:覆盖消息合并逻辑(`messageMerger`)与 LLM provider 映射(`llmProviderUtils`)等纯逻辑,快速、确定性、无网络,适合 CI。
- **端到端冒烟** `pnpm test:e2e`:用确定性 query(访问 `https://example.com` 取 H1)真实跑一遍 `run()`,验证 planner + BrowserAgent + LLM 全链路。**每次升级 eko 后跑这条即可确认集成无回归**。未配置 `OPENROUTER_API_KEY` 时会自动跳过(不报错)。

> 注:长时间、多站点的 Agent 任务在某些本地代理 / VPN 环境下可能被间歇性掐断连接;e2e 故意采用短确定性 query 以规避这类网络抖动。

## Electron 打包

```bash
pnpm build:electron          # 仅编译
pnpm build:electron:mac      # 打包 macOS
pnpm build:electron:win      # 打包 Windows
pnpm build:electron:linux    # 打包 Linux
```

打包会通过 `scripts/copy-playwright-browsers.js` 将 Chromium 一并打入,使桌面应用离线可用。

## 后端 API

- `GET/POST /api/agent/start` —— 创建任务,返回 `taskId` 与 SSE 地址。
- `GET /api/agent/stream/[taskId]` —— SSE 流式输出,前端通过 `useSSE` 订阅,实时渲染 Agent 消息。

> 任务状态保存在进程内 `taskStore`(单实例部署 / 桌面应用下是恰当设计)。
