import * as vscode from 'vscode';

export const youcomAgent: vscode.LanguageModelChatInformation = {
    id: 'youcom-agent',
    name: 'You.com Agent',
    family: 'youcom',
    version: '1.0.0',
    maxInputTokens: 4096,
    maxOutputTokens: 1024,
    capabilities: { toolCalling: false }
};

type YoucomAgentResponse = {
    readonly output?: unknown;
    readonly error?: unknown;
    readonly message?: unknown;
};

export async function handleYoucomResponse(
    messages: readonly vscode.LanguageModelChatRequestMessage[],
    progress: vscode.Progress<vscode.LanguageModelResponsePart>,
    token: vscode.CancellationToken,
    _options: vscode.ProvideLanguageModelChatResponseOptions
): Promise<void> {
    if (token.isCancellationRequested) {
        return;
    }

    const agentId = process.env.YOUCOM_AGENT_ID;
    if (!agentId) {
        progress.report(new vscode.LanguageModelTextPart('Missing YOUCOM_AGENT_ID environment variable.'));
        return;
    }

    const apiKey = process.env.YOUCOM_API_KEY;
    if (!apiKey) {
        progress.report(new vscode.LanguageModelTextPart('Missing YOUCOM_API_KEY environment variable.'));
        return;
    }

    const prompt = messages
        .map(message =>
            message.content
                .map(part => (part instanceof vscode.LanguageModelTextPart ? part.value : ''))
                .join('')
        )
        .join('\n')
        .trim();

    if (!prompt) {
        progress.report(new vscode.LanguageModelTextPart('Unable to construct a prompt from the provided messages.'));
        return;
    }

    const controller = new AbortController();
    const subscription = token.onCancellationRequested(() => controller.abort());

    const response = await fetch('https://api.you.com/v1/agents/runs', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            agent: agentId,
            input: prompt,
            stream: false
        }),
        signal: controller.signal
    }).catch(error => {
        console.error('[youcom-agent] Network request failed', error);
        return undefined;
    });

    subscription.dispose();

    if (!response) {
        progress.report(new vscode.LanguageModelTextPart('Failed to reach the You.com API.'));
        return;
    }

    if (token.isCancellationRequested) {
        return;
    }

    let payload: YoucomAgentResponse | undefined;
    try {
        payload = (await response.json()) as YoucomAgentResponse;
    } catch (error) {
        console.error('[youcom-agent] Failed to parse response JSON', error);
    }

    if (!response.ok) {
        const details = extractMessage(payload) ?? response.statusText;
        progress.report(new vscode.LanguageModelTextPart(`You.com API request failed: ${details}`));
        return;
    }

    const output = extractOutput(payload);
    progress.report(new vscode.LanguageModelTextPart(output ?? 'The You.com API returned an empty response.'));
}

function extractOutput(payload: YoucomAgentResponse | undefined): string | undefined {
    if (!payload) {
        return undefined;
    }

    if (typeof payload.output === 'string') {
        return payload.output;
    }

    if (payload.output && typeof payload.output === 'object') {
        try {
            return JSON.stringify(payload.output);
        } catch (error) {
            console.error('[youcom-agent] Unable to serialize output payload', error);
        }
    }

    const message = extractMessage(payload);
    return message ?? undefined;
}

function extractMessage(payload: YoucomAgentResponse | undefined): string | undefined {
    if (!payload) {
        return undefined;
    }

    if (typeof payload.message === 'string') {
        return payload.message;
    }

    if (typeof payload.error === 'string') {
        return payload.error;
    }

    if (payload.error && typeof payload.error === 'object' && 'message' in payload.error) {
        const message = (payload.error as { message?: unknown }).message;
        return typeof message === 'string' ? message : undefined;
    }

    return undefined;
}
