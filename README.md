# RandomPipe

A VS Code extension that plays the **pipe crashing meme sound effect** at random intervals while you code. Because nothing says "productivity" like a pipe bursting in your ears at an unpredictable moment.

## Features

- Plays a pipe-crashing sound at random intervals (configurable range)
- A new random interval is chosen after every sound
- Commands: Start, Stop, Toggle, Play Now
- Status bar item (🔊/🔇) showing current state — click to toggle
- All settings configurable via VS Code settings

## Requirements

- VS Code 1.80+
- Linux: `aplay` (usually pre-installed with ALSA)
- macOS: `afplay` (pre-installed)
- Windows: PowerShell (pre-installed)

## Installation

### From source

1. Clone this repo into your extensions folder (or anywhere).
2. Open the folder in VS Code.
3. Run `npm install`.
4. Run `npm run compile` to build.
5. Press `F5` to open the Extension Development Host and test.

### From a `.vsix`

1. `npm install -g @vscode/vsce`
2. `npm run package` to build `randompipe-0.0.1.vsix`
3. In VS Code: Extensions view → `...` → "Install from VSIX" → select the file.

## Usage

Once activated, RandomPipe starts automatically and plays a sound after a random delay (default 5–30 minutes). A new random delay is chosen after every sound.

### Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:

| Command | Command ID |
|---------|-----------|
| RandomPipe: Start | `randompipe.start` |
| RandomPipe: Stop | `randompipe.stop` |
| RandomPipe: Toggle | `randompipe.toggle` |
| RandomPipe: Play Now | `randompipe.playNow` |
| RandomPipe: Play Now | `Escape` (keyboard shortcut, when editor is focused) |

You can also click the status bar item at the bottom right to toggle.

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `randompipe.enabled` | `true` | Enable/disable RandomPipe |
| `randompipe.minIntervalMinutes` | `5` | Minimum minutes between sounds |
| `randompipe.maxIntervalMinutes` | `30` | Maximum minutes between sounds |

## Development

```bash
npm install        # install dependencies
npm run compile    # build TypeScript to out/
npm run watch      # watch mode for development
```

Press `F5` in VS Code to launch the Extension Development Host.

## License

MIT
