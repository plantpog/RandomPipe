import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

let timer: NodeJS.Timeout | null = null;
let statusBarItem: vscode.StatusBarItem;
let playCount = 0;
let outputChannel: vscode.OutputChannel;

function clearTimer(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('RandomPipe extension activated');

  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );

  outputChannel = vscode.window.createOutputChannel('RandomPipe');

  const soundPath = context.asAbsolutePath(path.join('media', 'pipe-crash.wav'));

  function getConfig() {
    return vscode.workspace.getConfiguration('randompipe');
  }

  function isEnabled(): boolean {
    return getConfig().get<boolean>('enabled', true);
  }

  function playSound(): void {
    if (!fs.existsSync(soundPath)) {
      void vscode.window.showWarningMessage(
        'RandomPipe: sound file not found: ' + soundPath
      );
      scheduleNext();
      return;
    }

    const platform = process.platform;
    let cmd: string;
    let args: string[];

    if (platform === 'linux') {
      cmd = 'aplay';
      args = [soundPath];
    } else if (platform === 'darwin') {
      cmd = 'afplay';
      args = [soundPath];
    } else if (platform === 'win32') {
      const escaped = soundPath.replace(/'/g, "''");
      cmd = 'powershell.exe';
      args = [
        '-Command',
        `Add-Type -AssemblyName System.Media; (New-Object System.Media.SoundPlayer '${escaped}').PlaySync();`
      ];
    } else {
      void vscode.window.showWarningMessage(
        `RandomPipe: unsupported platform "${platform}"`
      );
      scheduleNext();
      return;
    }

    playCount++;
    const now = new Date().toLocaleTimeString();
    outputChannel.appendLine(`[${now}] RandomPipe: play #${playCount} triggered`);
    outputChannel.show(true);

    const child = cp.execFile(cmd, args, (error) => {
      if (error) {
        console.error('RandomPipe playback error:', error.message);
      }
      scheduleNext();
    });
  }

  function getRandomIntervalMs(): number {
    const cfg = getConfig();
    const minMin = Math.max(1, cfg.get<number>('minIntervalMinutes', 5));
    const maxMin = Math.max(minMin, cfg.get<number>('maxIntervalMinutes', 30));
    const minMs = minMin * 60 * 1000;
    const maxMs = maxMin * 60 * 1000;
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  }

  function scheduleNext(): void {
    if (!isEnabled()) {
      clearTimer();
      return;
    }
    clearTimer();
    const delay = getRandomIntervalMs();
    timer = setTimeout(() => {
      playSound();
    }, delay);
    console.log(`RandomPipe: next sound in ${Math.round(delay / 60000)} minute(s)`);
  }

  function updateStatusBar(): void {
    const enabled = isEnabled();
    statusBarItem.text = enabled ? '$(radio-signal) RandomPipe' : '$(debug-pause) RandomPipe';
    statusBarItem.tooltip = enabled
      ? `RandomPipe is enabled. Click to disable. (${playCount} plays)`
      : `RandomPipe is disabled. Click to enable. (${playCount} plays)`;
    statusBarItem.command = 'randompipe.toggle';
    statusBarItem.show();
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('randompipe.start', () => {
      getConfig().update('enabled', true, vscode.ConfigurationTarget.Global);
      updateStatusBar();
      scheduleNext();
      void vscode.window.showInformationMessage(
        'RandomPipe started. Listen for the pipes...'
      );
    }),
    vscode.commands.registerCommand('randompipe.stop', () => {
      getConfig().update('enabled', false, vscode.ConfigurationTarget.Global);
      updateStatusBar();
      clearTimer();
      void vscode.window.showInformationMessage('RandomPipe stopped.');
    }),
    vscode.commands.registerCommand('randompipe.toggle', () => {
      const enabled = isEnabled();
      getConfig().update('enabled', !enabled, vscode.ConfigurationTarget.Global);
      updateStatusBar();
      if (!enabled) {
        scheduleNext();
        void vscode.window.showInformationMessage('RandomPipe enabled.');
      } else {
        clearTimer();
        void vscode.window.showInformationMessage('RandomPipe disabled.');
      }
    }),
    vscode.commands.registerCommand('randompipe.playNow', () => {
      playSound();
      void vscode.window.showInformationMessage('RandomPipe: playing sound now!');
    }),
    vscode.workspace.onDidChangeConfiguration(() => {
      updateStatusBar();
      if (isEnabled() && !timer) {
        scheduleNext();
      }
    }),
    statusBarItem
  );

  updateStatusBar();
  if (isEnabled()) {
    scheduleNext();
  }
}

export function deactivate(): void {
  clearTimer();
}
