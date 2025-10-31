# You.com Agents VS Code Extension

You.com Agents is a VS Code extension that plugs custom You.com chat agents into the experimental Language Model (LM) API. It exposes a modular provider so you can route Copilot Agent Mode requests to You.com, add new agents, and stream their responses back into the editor.

## Features
- Registers a `youcom` LM provider when the host VS Code release exposes `vscode.lm`.
- Ships with a `youcom-agent` example that calls the You.com Agents API.
- Streams agent responses via `LanguageModelTextPart` so output appears progressively in the Copilot chat UI.
- Includes a Mocha test that verifies outbound requests to `https://api.you.com/v1/agents/runs`.

## Getting Started
1. **Install dependencies**
   ```bash
   pnpm install
   ```
2. **Provide credentials**
   Export the required environment variables before launching VS Code or running tests:
   ```bash
   export YOUCOM_API_KEY=sk-your-key
   export YOUCOM_AGENT_ID=agent-id-guid
   ```
   These values authorize the extension when it forwards requests to the You.com API.
3. **Build the extension**
   ```bash
   pnpm run compile
   ```
4. **Launch the Extension Development Host**
   Press `F5` in VS Code (or use the `Run and Debug` view) to open a development host with the provider registered.

## Commands and Activation
- `you-com-agents.helloWorld` – Sample command created by the scaffolding.
- `youcom.manage` – Placeholder command for managing You.com credentials.

The extension registers the chat provider automatically during activation if `vscode.lm.registerLanguageModelChatProvider` is available. No activation events are declared, so VS Code activates the extension on first command invocation or when the LM provider is registered.

## Configuration
- `YOUCOM_API_KEY` – Required. Bearer token for the You.com Agents API.
- `YOUCOM_AGENT_ID` – Required. Agent identifier provided by You.com.

Because secrets live outside the repository, you can load them with your preferred secrets manager (for example `sops exec-env`). The extension validates both variables at runtime and returns informative messages if they are missing.

## Development Workflow
| Purpose          | Command                    | Notes |
|------------------|----------------------------|-------|
| Compile & lint   | `pnpm run compile`         | Runs `check-types`, `lint`, and `esbuild`. |
| Continuous build | `pnpm run watch`           | Concurrent esbuild + `tsc --watch`. |
| Tests            | `pnpm test`                | Executes `src/test` via `@vscode/test`. |
| Package          | `pnpm dlx vsce package`    | Produces a `.vsix` after validation. |

The `pnpm test` script runs a `pretest` pipeline (`compile-tests`, `compile`, `lint`) to keep the build healthy before exercising the Mocha suite.

## Testing Notes
- `src/test/youcomAgents.test.ts` stubs `fetch` to assert that the agent posts the correct payload, headers, and body to the You.com endpoint.
- `src/test/extension.test.ts` keeps the default sample test to ensure the VS Code test harness boots successfully.

## Adding Additional Agents
1. Create a new file in `src/agents/` that exports both:
   - A `LanguageModelChatInformation` descriptor.
   - A handler that accepts `(messages, progress, token, options)` and reports `LanguageModelResponsePart`s.
2. Import the agent into `src/provider.ts` and append it to the `agents` array.
3. Extend `handle...` logic to route to your handler based on `model.id`.
4. Add unit tests that exercise the new handler, mirroring the existing You.com test.

Refer to `docs/howtoadd-agents.md` for a guided walkthrough with additional context and screenshots.

## Packaging and Distribution
1. Run `pnpm run compile` to ensure the TypeScript sources build into `dist/extension.js`.
2. Remove any scaffolding text from this README (already done).
3. Package the extension:
   ```bash
   pnpm dlx vsce package
   ```
   The command generates `you-com-agents-0.0.1.vsix`.
4. Install the VSIX locally via the Extensions view (`…` → `Install from VSIX…`) or publish it with `pnpm dlx vsce publish`.

## Troubleshooting
- **`vscode.lm` unavailable** – Update VS Code to 1.105.0 or later, or fall back to versions that support the LM preview API.
- **`Missing YOUCOM_API_KEY` or `YOUCOM_AGENT_ID`** – Ensure the environment variables are exported before launching the extension host or running tests.
- **`vsce package` warning about README** – The current README already contains project-specific content. If you edit it, keep at least one section describing features and usage.
- **Tests failing to reach the API** – Tests stub `fetch`. If you add integration tests, guard them behind environment checks to avoid hitting the live API in CI.

## Resources
- [VS Code Language Model API (preview)](https://code.visualstudio.com/api)
- [You.com Agents API documentation](https://api.you.com)
- [docs/howtoadd-agents.md](docs/howtoadd-agents.md) within this repository

---

Happy hacking! Contributions and feedback are welcome via pull requests or issues. !*** End Patch
# You.com-Agents-Extention
