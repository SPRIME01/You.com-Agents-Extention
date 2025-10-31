// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ModularChatProvider } from './provider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "you-com-agents" is now active!');

	// Register the You.com language-model chat provider if available
	if ((vscode as any).lm && typeof (vscode as any).lm.registerLanguageModelChatProvider === 'function') {
		try {
			(vscode as any).lm.registerLanguageModelChatProvider('youcom', new ModularChatProvider());
			console.log('Registered You.com language model chat provider (youcom).');
		} catch (err) {
			console.error('Failed to register You.com language model chat provider:', err);
		}
	} else {
		// Host may not support the LM API; warn but keep extension functional
		console.warn('vscode.lm.registerLanguageModelChatProvider is not available in this host/version.');
	}

	// Keep the existing hello world command (defined in package.json)
	const disposableHello = vscode.commands.registerCommand('you-com-agents.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from You.com Agents!');
	});
	context.subscriptions.push(disposableHello);

	// Add the new management command for the You.com provider
	const disposableManage = vscode.commands.registerCommand('youcom.manage', () => {
		vscode.window.showInformationMessage('Manage You.com agents and API keys.');
	});
	context.subscriptions.push(disposableManage);
}

// This method is called when your extension is deactivated
export function deactivate() { }
