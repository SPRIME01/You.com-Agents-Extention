# Build & package

## Install
- Run `pnpm install` (one-time).
- Build and produce `dist/extension.js` with:
    `pnpm run package` (runs lint, type-check, and emits the bundle).

## Create VSIX
- Package the extension:
    `npx vsce package`
    or
    `pnpm dlx vsce package`
- This creates a file like `you-com-agents-0.0.1.vsix`.

## Load in VS Code
- In VS Code: Extensions view → … menu → **Install from VSIX…** → select the generated `.vsix`.
- For development with live reload: run `pnpm run watch` and use Run → Start Debugging (Extension Development Host).

## Verify
- Export required env vars before launching the host so the agent can authenticate, e.g.:
    - `export YOUCOM_API_KEY=...`
    - `export YOUCOM_AGENT_ID=...`
- Optional sanity check: run `pnpm test` before packaging to ensure the test suite is green.

## Next steps / tips
- If you iterate often, install `@vscode/vsce` globally: `pnpm add -g @vscode/vsce`.
- After installing the VSIX, open the Command Palette and trigger your extension commands to confirm the agent registers correctly.
- Do not edit files under `dist/` by hand — use the build scripts (`esbuild.js`) to produce them.
