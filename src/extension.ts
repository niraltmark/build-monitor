import * as vscode from "vscode";
import { Realtime } from "ably";

export function activate(context: vscode.ExtensionContext) {
  const ablyApiKey =
    "VcyHvw.cP1rxQ:k7obrq9UseQssDuB9xIQrM65ZrMRRz58cR4TsH3M3r0"; // Use a read-only public key
  const redThemeName = "RedAlertish";

  const ably = new Realtime(ablyApiKey);
  const channel = ably.channels.get("ci-events");

  channel.subscribe("workflow_failed", async (message) => {
    const { user, repo, run_id } = message.data;

    const currentTheme = vscode.workspace
      .getConfiguration()
      .get<string>("workbench.colorTheme");
    const savedTheme = context.globalState.get<string>("originalColorTheme");

    if (!savedTheme) {
      await context.globalState.update("originalColorTheme", currentTheme);
    }

    const availableThemes = vscode.extensions.all.flatMap(
      (ext) =>
        ext.packageJSON?.contributes?.themes?.map((t: any) => t.label) ?? []
    );

    console.log("Available themes:", availableThemes);

    if (!availableThemes.includes(redThemeName)) {
      vscode.window.showWarningMessage(
        `Theme "${redThemeName}" is not installed. Please install it to enable CI alerts.`
      );
      return;
    }

    await vscode.workspace
      .getConfiguration()
      .update(
        "workbench.colorTheme",
        redThemeName,
        vscode.ConfigurationTarget.Global
      );

    const selection = await vscode.window.showWarningMessage(
      `CI failed in ${repo} by ${user}`,
      "View Run",
      "Restore Theme"
    );

    if (selection === "View Run") {
      const url = `https://github.com/${repo}/actions/runs/${run_id}`;
      vscode.env.openExternal(vscode.Uri.parse(url));
    } else if (selection === "Restore Theme") {
      const original = context.globalState.get<string>("originalColorTheme");
      if (original) {
        await vscode.workspace
          .getConfiguration()
          .update(
            "workbench.colorTheme",
            original,
            vscode.ConfigurationTarget.Global
          );
      }
    }
  });

  let disposable = vscode.commands.registerCommand(
    "ciTheme.restoreOriginalTheme",
    async () => {
      const originalTheme =
        context.globalState.get<string>("originalColorTheme");
      if (!originalTheme) {
        vscode.window.showInformationMessage("No original theme stored yet.");
        return;
      }

      await vscode.workspace
        .getConfiguration()
        .update(
          "workbench.colorTheme",
          originalTheme,
          vscode.ConfigurationTarget.Global
        );

      vscode.window.showInformationMessage(`Restored theme: ${originalTheme}`);
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
