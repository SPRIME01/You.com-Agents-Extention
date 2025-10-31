## you-com-agents — Copilot instructions for code suggestions

Purpose: Give an AI coding agent the minimal, precise knowledge needed to be productive in this VS Code extension repo.

- Project type: VS Code extension written in TypeScript. Entry built to `./dist/extension.js` by `esbuild.js`.
- Key files:
  - `src/extension.ts` — activation and command registration (helloWorld + youcom.manage). The extension's runtime registers the LM provider when available.
  - `src/provider.ts` — implements `vscode.LanguageModelChatProvider` via `ModularChatProvider`. New agents should be exposed here.
  - `src/agents/youcomAgents.ts` — one agent implementation (`youcomAgent`) and `handleYoucomResponse` which calls the You.com API using `process.env.YOUCOM_API_KEY` and reports via `vscode.LanguageModelTextPart`.
  - `esbuild.js` — bundling entry used by the `compile` / `package` scripts.
  - `package.json` — build/test/watch commands and extension metadata (main -> `./dist/extension.js`).

What an AI should know to modify or extend this repo

1. Architecture / patterns

- The extension exposes a modular chat provider: `ModularChatProvider` (implements `LanguageModelChatProvider`) holds an `agents` array. Add new agents by creating a file under `src/agents/` exporting a `LanguageModelChatInformation` object and any handler, then import and include it in `provider.ts`'s `agents` list.
- Agent handlers receive `messages` and a `progress` (vscode.Progress<vscode.LanguageModelResponsePart>). Use `progress.report(new vscode.LanguageModelTextPart(...))` to stream or deliver responses.
- Token counting is approximate in `provider.ts` (`Math.ceil(text.length / 4)`). Keep similar behavior for new agents unless you add a model-specific counter.

2. Build / test / dev workflow

- Use pnpm/npm scripts in `package.json`: `pnpm run compile` (type-check + lint + esbuild), `pnpm run watch` to run `watch:esbuild` and `watch:tsc` concurrently, and `pnpm test` (uses `vscode-test`).
- `main` points at `./dist/extension.js`, which `esbuild.js` produces — don't edit `dist/` by hand.
- Tests live in `src/test/` and `pretest` runs `compile-tests`, `compile`, and `lint`.

3. Integration & external dependencies

- The You.com API is called directly from `src/agents/youcomAgents.ts` using `fetch` and `process.env.YOUCOM_API_KEY`; do NOT hardcode API keys. Use environment variables in CI or local dev.
- The repo relies on the VS Code Language Model (LM) API at runtime: `vscode.lm.registerLanguageModelChatProvider('youcom', new ModularChatProvider())` — guard runtime calls because older hosts may not expose `vscode.lm`.

4. Conventions and gotchas

- TypeScript: `tsconfig.json` uses `Node16` module and `strict: true`. Prefer type-safe changes and run `pnpm run check-types` before committing.
- ESLint: run `pnpm run lint` (script uses `eslint src`). Keep exported agent shapes compatible with `vscode.LanguageModelChatInformation`.
- Activation: `activationEvents` is empty in `package.json`, so activation is manual (first command or programmatic). If you add commands, register them in `contributes.commands`.

5. Small examples for common tasks

- Add a new agent: create `src/agents/myAgent.ts` exporting `const myAgent: LanguageModelChatInformation` and `async function handleMyAgent(messages, progress) { progress.report(new vscode.LanguageModelTextPart('…')) }`. Import in `src/provider.ts` and push to `this.agents`.
- Local dev: `pnpm run watch` then attach the Extension Development Host in VS Code to iterate quickly.

If anything here is unclear or you want more detail (launch configurations, CI, or example agent tests), say which part and I will expand or add files (launch.json, sample agent, test).
