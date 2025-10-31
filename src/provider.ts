import * as vscode from 'vscode';
import { youcomAgent, handleYoucomResponse } from './agents/youcomAgents';

export class ModularChatProvider implements vscode.LanguageModelChatProvider {
    private readonly agents: vscode.LanguageModelChatInformation[] = [youcomAgent];

    async provideLanguageModelChatInformation(
        options: vscode.PrepareLanguageModelChatModelOptions,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelChatInformation[]> {
        return options.silent ? [] : this.agents;
    }

    async provideLanguageModelChatResponse(
        model: vscode.LanguageModelChatInformation,
        messages: readonly vscode.LanguageModelChatRequestMessage[],
        options: vscode.ProvideLanguageModelChatResponseOptions,
        progress: vscode.Progress<vscode.LanguageModelResponsePart>,
        token: vscode.CancellationToken
    ): Promise<void> {
        if (token.isCancellationRequested) {
            return;
        }

        switch (model.id) {
            case youcomAgent.id:
                await handleYoucomResponse(messages, progress, token, options);
                return;
            default:
                progress.report(new vscode.LanguageModelTextPart('Unknown agent.'));
        }
    }

    async provideTokenCount(
        model: vscode.LanguageModelChatInformation,
        text: string | vscode.LanguageModelChatRequestMessage,
        _token: vscode.CancellationToken
    ): Promise<number> {
        const resolvedText =
            typeof text === 'string'
                ? text
                : text.content
                      .map(part => (part instanceof vscode.LanguageModelTextPart ? part.value : ''))
                      .join('');

        return Math.ceil(resolvedText.length / 4);
    }
}
