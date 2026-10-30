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
const cp = __importStar(require("child_process"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
let timer = null;
let statusBarItem;
let playCount = 0;
let outputChannel;
function clearTimer() {
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
}
function activate(context) {
    console.log('RandomPipe extension activated');
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    outputChannel = vscode.window.createOutputChannel('RandomPipe');
    const soundPath = context.asAbsolutePath(path.join('media', 'pipe-crash.wav'));
    function getConfig() {
        return vscode.workspace.getConfiguration('randompipe');
    }
    function isEnabled() {
        return getConfig().get('enabled', true);
    }
    function playSound() {
        if (!fs.existsSync(soundPath)) {
            void vscode.window.showWarningMessage('RandomPipe: sound file not found: ' + soundPath);
            scheduleNext();
            return;
        }
        const platform = process.platform;
        let cmd;
        let args;
        if (platform === 'linux') {
            cmd = 'aplay';
            args = [soundPath];
        }
        else if (platform === 'darwin') {
            cmd = 'afplay';
            args = [soundPath];
        }
        else if (platform === 'win32') {
            const escaped = soundPath.replace(/'/g, "''");
            cmd = 'powershell.exe';
            args = [
                '-Command',
                `Add-Type -AssemblyName System.Media; (New-Object System.Media.SoundPlayer '${escaped}').PlaySync();`
            ];
        }
        else {
            void vscode.window.showWarningMessage(`RandomPipe: unsupported platform "${platform}"`);
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
    function getRandomIntervalMs() {
        const cfg = getConfig();
        const minMin = Math.max(1, cfg.get('minIntervalMinutes', 5));
        const maxMin = Math.max(minMin, cfg.get('maxIntervalMinutes', 30));
        const minMs = minMin * 60 * 1000;
        const maxMs = maxMin * 60 * 1000;
        return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    }
    function scheduleNext() {
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
    function updateStatusBar() {
        const enabled = isEnabled();
        statusBarItem.text = enabled ? '$(radio-signal) RandomPipe' : '$(debug-pause) RandomPipe';
        statusBarItem.tooltip = enabled
            ? `RandomPipe is enabled. Click to disable. (${playCount} plays)`
            : `RandomPipe is disabled. Click to enable. (${playCount} plays)`;
        statusBarItem.command = 'randompipe.toggle';
        statusBarItem.show();
    }
    context.subscriptions.push(vscode.commands.registerCommand('randompipe.start', () => {
        getConfig().update('enabled', true, vscode.ConfigurationTarget.Global);
        updateStatusBar();
        scheduleNext();
        void vscode.window.showInformationMessage('RandomPipe started. Listen for the pipes...');
    }), vscode.commands.registerCommand('randompipe.stop', () => {
        getConfig().update('enabled', false, vscode.ConfigurationTarget.Global);
        updateStatusBar();
        clearTimer();
        void vscode.window.showInformationMessage('RandomPipe stopped.');
    }), vscode.commands.registerCommand('randompipe.toggle', () => {
        const enabled = isEnabled();
        getConfig().update('enabled', !enabled, vscode.ConfigurationTarget.Global);
        updateStatusBar();
        if (!enabled) {
            scheduleNext();
            void vscode.window.showInformationMessage('RandomPipe enabled.');
        }
        else {
            clearTimer();
            void vscode.window.showInformationMessage('RandomPipe disabled.');
        }
    }), vscode.commands.registerCommand('randompipe.playNow', () => {
        playSound();
        void vscode.window.showInformationMessage('RandomPipe: playing sound now!');
    }), vscode.workspace.onDidChangeConfiguration(() => {
        updateStatusBar();
        if (isEnabled() && !timer) {
            scheduleNext();
        }
    }), statusBarItem);
    updateStatusBar();
    if (isEnabled()) {
        scheduleNext();
    }
}
function deactivate() {
    clearTimer();
}
//# sourceMappingURL=extension.js.map