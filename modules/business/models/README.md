# Business Models Architecture

This directory contains the LLM provider abstraction used by `PromptTemplateExecutor`.

## Directory Structure

- `types/`: shared contracts and cross-provider types.
- `resolver/`: provider selector based on environment variables.
- `open-ai/`: OpenAI key loader and caller implementation.
- `deepseek/`: DeepSeek key loader and caller implementation.

## Executor Flow

`PromptTemplateExecutor` does not call a specific provider directly anymore.

1. Builds prompt payload (`messages`, `model`, `temperature`, `format`, etc.).
2. Resolves provider through `ModelResolver.get()`.
3. Uses `caller.generate(...)` for non-streaming requests.
4. Uses `caller.incremental(...)` for streaming requests.

This keeps HTTP/business layers provider-agnostic while preserving current prompt logic.

## How Provider Selection Works

`ModelResolver` reads `LLM_PROVIDER`:

- `openai` -> `OpenAICaller`
- `deepseek` -> `DeepSeekCaller`
- Any unknown value -> fallback to `OpenAICaller`

## Environment Variables

Required variables:

- `LLM_PROVIDER` (`openai` or `deepseek`)
- `GPT_MODEL` (model name for the selected provider)
- `OPENAI_API_KEY` (required when using `openai`)
- `DEEPSEEK_API_KEY` (required when using `deepseek`)

Example:

```env
LLM_PROVIDER='openai'
GPT_MODEL='gpt-4o-mini'
OPENAI_API_KEY='...'
DEEPSEEK_API_KEY='...'
```

To test with DeepSeek:

```env
LLM_PROVIDER='deepseek'
GPT_MODEL='deepseek-chat'
```

## Provider Behavior Notes

- OpenAI caller keeps support for `store`, `metadata`, and `json_schema`.
- DeepSeek caller uses OpenAI SDK compatibility via `baseURL='https://api.deepseek.com'`.
- DeepSeek caller maps `json_schema` requests to `json_object` for compatibility.
- DeepSeek caller intentionally omits unsupported request fields like `store` and `metadata`.

## How to Add a New Provider

1. Create `models/<provider>/key/index.ts` to load API key from env.
2. Create `models/<provider>/caller/index.ts` implementing the shared caller shape:
   - `generate(params)`
   - `incremental(params)`
3. Reuse contracts from `models/types`.
4. Add provider branch in `models/resolver/index.ts`.
5. Document new env vars and provider limits in this README and `.env.example`.
6. Validate both streaming and non-streaming behavior through chat HTTP endpoints.

## Shared Contracts

All providers must use:

- `IQueryExecutionParams`
- `IncrementalResponseType`
- `ResponseType`
- `IResolvedTool`
- `MessagesType`

Defined in `models/types/index.ts`.
