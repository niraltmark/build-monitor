"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const ably_1 = require("ably");
function activate(context) {
    const ablyApiKey = "VcyHvw.cP1rxQ:k7obrq9UseQssDuB9xIQrM65ZrMRRz58cR4TsH3M3r0"; // Use a read-only public key
    const redThemeName = "redalertish";
    const ably = new ably_1.Realtime(ablyApiKey);
    const channel = ably.channels.get("ci-events");
    channel.subscribe("workflow_failed", async (message) => {
        const { user, repo, run_id } = message.data;
        const currentTheme = vscode.workspace
            .getConfiguration()
            .get("workbench.colorTheme");
        const savedTheme = context.globalState.get("originalColorTheme");
        if (!savedTheme) {
            await context.globalState.update("originalColorTheme", currentTheme);
        }
        const availableThemes = vscode.extensions.all.flatMap((ext) => ext.packageJSON?.contributes?.themes?.map((t) => t.label) ?? []);
        if (!availableThemes.includes(redThemeName)) {
            vscode.window.showWarningMessage(`Theme "${redThemeName}" is not installed. Please install it to enable CI alerts.`);
            return;
        }
        await vscode.workspace
            .getConfiguration()
            .update("workbench.colorTheme", redThemeName, vscode.ConfigurationTarget.Global);
        const selection = await vscode.window.showWarningMessage(`CI failed in ${repo} by ${user}`, "View Run", "Restore Theme");
        if (selection === "View Run") {
            const url = `https://github.com/${repo}/actions/runs/${run_id}`;
            vscode.env.openExternal(vscode.Uri.parse(url));
        }
        else if (selection === "Restore Theme") {
            const original = context.globalState.get("originalColorTheme");
            if (original) {
                await vscode.workspace
                    .getConfiguration()
                    .update("workbench.colorTheme", original, vscode.ConfigurationTarget.Global);
            }
        }
    });
    let disposable = vscode.commands.registerCommand("ciTheme.restoreOriginalTheme", async () => {
        const originalTheme = context.globalState.get("originalColorTheme");
        if (!originalTheme) {
            vscode.window.showInformationMessage("No original theme stored yet.");
            return;
        }
        await vscode.workspace
            .getConfiguration()
            .update("workbench.colorTheme", originalTheme, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Restored theme: ${originalTheme}`);
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map