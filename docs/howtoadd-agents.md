# 🧠 You.com Agent Integration with GitHub Copilot Pro in VS Code

## 📦 Overview

This guide explains how to register and use custom You.com agents inside Visual Studio Code using GitHub Copilot Pro. It leverages the Language Model Chat Provider API and modular TypeScript extension scaffolding.

---

## 🛠️ Prerequisites

- GitHub Copilot Pro subscription
- You.com Pro subscription with API access
- Node.js and VS Code installed
- `yo code` and `esbuild` installed globally

---

## 🧱 Project structure

```txt
youcom-chat-provider/
├── src/
│   ├── agents/
│   │   └── youcomAgent.ts         # First agent module
│   ├── provider.ts                # Central provider logic
│   └── extension.ts               # Activation and registration
├── package.json
└── tsconfig.json
```

---

## 📄 Agent module (`youcomAgent.ts`)

```ts
import * as vscode from 'vscode';

export const youcomAgent: vscode.LanguageModelChatInformation = {
    id: 'youcom-agent',
    name: 'You.com Agent',
    family: 'youcom',
    version: '1.0.0',
    maxInputTokens: 4096,
    maxOutputTokens: 1024,
    capabilities: { toolCalling: true }
};

export async function handleYoucomResponse(
    messages: readonly vscode.LanguageModelChatRequestMessage[],
    progress: vscode.Progress<vscode.LanguageModelResponsePart>
): Promise<void> {
    const prompt = messages
        .map(m => m.content.map(c => (c as vscode.LanguageModelTextPart).value).join(''))
        .join('\n');

    const response = await fetch('https://api.you.com/v1/agents/runs', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.YOUCOM_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            agent: 'your-agent-id',
            input: prompt,
            stream: false
        })
    }).then(res => res.json());

    progress.report(new vscode.LanguageModelTextPart(response.output));
}
```

---

## 🧩 Provider logic (`provider.ts`)

```ts
import * as vscode from 'vscode';
import { youcomAgent, handleYoucomResponse } from './agents/youcomAgent';

export class ModularChatProvider implements vscode.LanguageModelChatProvider {
    private agents = [youcomAgent];

    async provideLanguageModelChatInformation(options: { silent: boolean }, token: vscode.CancellationToken) {
        return options.silent ? [] : this.agents;
    }

    async provideLanguageModelChatResponse(
        model: vscode.LanguageModelChatInformation,
        messages: readonly vscode.LanguageModelChatRequestMessage[],
        options: any,
        progress: vscode.Progress<vscode.LanguageModelResponsePart>,
        token: vscode.CancellationToken
    ) {
        switch (model.id) {
            case 'youcom-agent':
                await handleYoucomResponse(messages, progress);
                break;
            default:
                progress.report(new vscode.LanguageModelTextPart('Unknown agent.'));
        }
    }

    async provideTokenCount(model: vscode.LanguageModelChatInformation, text: string, token?: vscode.CancellationToken) {
        return Math.ceil(text.length / 4);
    }
}
```

---

## 🚀 Extension activation (`extension.ts`)

```ts
import * as vscode from 'vscode';
import { ModularChatProvider } from './provider';

export function activate(context: vscode.ExtensionContext) {
    vscode.lm.registerLanguageModelChatProvider('youcom', new ModularChatProvider());

    context.subscriptions.push(
        vscode.commands.registerCommand('youcom.manage', () => {
            vscode.window.showInformationMessage('Manage You.com agents and API keys.');
        })
    );
}
```

---

## 📦 package.json snippet

```json
"contributes": {
    "languageModelChatProviders": [
        {
            "vendor": "youcom",
            "displayName": "You.com Agent",
            "managementCommand": "youcom.manage"
        }
    ],
    "commands": [
        {
            "command": "youcom.manage",
            "title": "Manage You.com Agent"
        }
    ]
}
```

---

## 🧠 Notes

- Add more agents by creating new modules in `agents/` and importing them into `provider.ts`.
- Use environment variables or a secure config to manage API keys and agent IDs.
- To test, run F5 in VS Code and select your agent from the model picker.

