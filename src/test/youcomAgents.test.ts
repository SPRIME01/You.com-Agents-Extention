import * as assert from 'assert';
import * as vscode from 'vscode';
import { handleYoucomResponse } from '../agents/youcomAgents';

suite('You.com Agent', () => {
    const originalFetch = globalThis.fetch;
    const originalApiKey = process.env.YOUCOM_API_KEY;
    const originalAgentId = process.env.YOUCOM_AGENT_ID;

    teardown(() => {
        globalThis.fetch = originalFetch;
        process.env.YOUCOM_API_KEY = originalApiKey;
        process.env.YOUCOM_AGENT_ID = originalAgentId;
    });

    test('sends a properly formatted request to the You.com Agents API', async () => {
        const apiKey = 'test-api-key';
        const agentId = 'agent-123';
        process.env.YOUCOM_API_KEY = apiKey;
        process.env.YOUCOM_AGENT_ID = agentId;

        let invocationCount = 0;

        globalThis.fetch = (async (input, init) => {
            invocationCount += 1;

            const url = typeof input === 'string' ? input : input.toString();
            assert.strictEqual(url, 'https://api.you.com/v1/agents/runs');

            assert.ok(init, 'fetch init options should be defined');
            assert.strictEqual(init?.method, 'POST');

            const authorizationHeader = readHeader(init?.headers, 'Authorization');
            assert.strictEqual(authorizationHeader, `Bearer ${apiKey}`);

            const body = init?.body;
            assert.ok(body, 'request body should be defined');
            const bodyText = typeof body === 'string' ? body : body?.toString();
            assert.ok(bodyText, 'request body should be serializable to text');

            const parsedBody = JSON.parse(bodyText as string);
            assert.deepStrictEqual(parsedBody, { agent: agentId, input: 'Hello world', stream: false });

            const responsePayload = { output: 'mocked agent response' };

            return {
                ok: true,
                statusText: 'OK',
                json: async () => responsePayload
            } as unknown as Response;
        }) as typeof fetch;

        const messages: vscode.LanguageModelChatRequestMessage[] = [
            {
                role: vscode.LanguageModelChatMessageRole.User,
                content: [new vscode.LanguageModelTextPart('Hello world')],
                name: undefined
            }
        ];

        const reportedParts: vscode.LanguageModelResponsePart[] = [];
        const progress: vscode.Progress<vscode.LanguageModelResponsePart> = {
            report: part => reportedParts.push(part)
        };

        const tokenSource = new vscode.CancellationTokenSource();

        await handleYoucomResponse(messages, progress, tokenSource.token, {
            toolMode: vscode.LanguageModelChatToolMode.Auto
        });

        tokenSource.dispose();

        assert.strictEqual(invocationCount, 1, 'fetch should be called exactly once');
        assert.strictEqual(reportedParts.length, 1, 'progress should receive exactly one response part');

        const [responsePart] = reportedParts;
        assert.ok(responsePart instanceof vscode.LanguageModelTextPart, 'response part should be a LanguageModelTextPart');
        assert.strictEqual(responsePart.value, 'mocked agent response');
    });
});

function readHeader(headersInit: unknown, headerName: string): string | undefined {
    if (!headersInit) {
        return undefined;
    }

    const expectedName = headerName.toLowerCase();
    const headersAny = headersInit as any;

    if (headersAny && typeof headersAny.get === 'function') {
        return headersAny.get(headerName) ?? headersAny.get(expectedName);
    }

    if (Array.isArray(headersAny)) {
        const match = headersAny.find(([name]: [string, string]) => name.toLowerCase() === expectedName);
        return match ? match[1] : undefined;
    }

    const record = headersAny as Record<string, string | undefined>;
    return record[headerName] ?? record[expectedName];
}
