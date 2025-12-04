# Zork I - Installation Instructions

Welcome to the modern rewrite of Zork I! This guide will help you install and run the game on your computer.

## Choose Your Installation Method

### Option 1: Standalone Executable (Recommended for Players)
**No Node.js required** - Download and run immediately

- [macOS Intel](#macos-intel-installation)
- [macOS Apple Silicon](#macos-apple-silicon-installation)
- [Windows](#windows-installation)

### Option 2: From Source (For Developers)
**Requires Node.js** - Run from source code

- [Developer Installation](#developer-installation)

---

## macOS Intel Installation

For Intel-based Macs (pre-2020 or Intel processor)

### Download
Download `zork-macos-intel-v1.0.0.tar.gz`

### Install
1. Open Terminal
2. Navigate to your Downloads folder:
   ```bash
   cd ~/Downloads
   ```
3. Extract the archive:
   ```bash
   tar -xzf zork-macos-intel-v1.0.0.tar.gz
   ```
4. Navigate to the folder:
   ```bash
   cd zork-macos-intel-v1.0.0
   ```
5. Make the file executable:
   ```bash
   chmod +x zork
   ```

### Run
```bash
./zork
```

### Troubleshooting

**"Cannot be opened because the developer cannot be verified"**

macOS Gatekeeper may block unsigned applications. To allow:

1. Right-click (or Control-click) on `zork`
2. Select "Open"
3. Click "Open" in the dialog

Or use Terminal:
```bash
xattr -d com.apple.quarantine zork
./zork
```

**Permission Denied**
```bash
chmod +x zork
```

---

## macOS Apple Silicon Installation

For Apple Silicon Macs (M1, M2, M3 processors - 2020 and later)

### Download
Download `zork-macos-arm64-v1.0.0.tar.gz`

### Install
1. Open Terminal
2. Navigate to your Downloads folder:
   ```bash
   cd ~/Downloads
   ```
3. Extract the archive:
   ```bash
   tar -xzf zork-macos-arm64-v1.0.0.tar.gz
   ```
4. Navigate to the folder:
   ```bash
   cd zork-macos-arm64-v1.0.0
   ```
5. Make the file executable:
   ```bash
   chmod +x zork
   ```

### Run
```bash
./zork
```

### Troubleshooting
Same as Intel version above.

---

## Windows Installation

For Windows 10 or later

### Download
Download `zork-windows-v1.0.0.zip`

### Install
1. Right-click the ZIP file
2. Select "Extract All..."
3. Choose a destination folder
4. Click "Extract"

### Run
1. Open the extracted folder
2. Double-click `zork.exe`

Or from Command Prompt:
```cmd
cd path\to\zork-windows-v1.0.0
zork.exe
```

### Troubleshooting

**Windows Defender SmartScreen Warning**

Windows may show a warning for unsigned executables:
1. Click "More info"
2. Click "Run anyway"

**Antivirus Blocking**

Some antivirus software may flag the executable:
1. Add an exception for `zork.exe`
2. Or temporarily disable antivirus during installation

**No Terminal Window**

The game requires a terminal. Use:
- Command Prompt (search for "cmd")
- PowerShell (search for "PowerShell")
- Windows Terminal (recommended - available in Microsoft Store)

---

## Developer Installation

For developers who want to run from source or contribute to the project.

### Requirements
- Node.js v20.x or later
- npm (comes with Node.js)

### Install Node.js
- macOS: Download from [nodejs.org](https://nodejs.org/) or use Homebrew: `brew install node`
- Windows: Download from [nodejs.org](https://nodejs.org/)

### Clone or Download
```bash
git clone <repository-url>
cd zork-rewrite
```

Or download and extract the source code ZIP.

### Install Dependencies
```bash
npm install
```

### Run in Development Mode
```bash
npm run dev
```

### Build and Run
```bash
npm run build
npm start
```

### Run Tests
```bash
npm test
```

---

## Optional: Add to PATH

To run Zork from anywhere on your system:

### macOS
```bash
sudo cp zork /usr/local/bin/
```

Then run from any Terminal:
```bash
zork
```

### Windows
1. Copy `zork.exe` to a permanent location (e.g., `C:\Program Files\Zork\`)
2. Add to PATH:
   - Search for "Environment Variables" in Windows
   - Click "Environment Variables"
   - Under "System variables", select "Path"
   - Click "Edit"
   - Click "New"
   - Add the folder path containing `zork.exe`
   - Click "OK" on all dialogs

Then run from any Command Prompt:
```cmd
zork
```

---

## Playing the Game

### Starting
When you run Zork, you'll see the opening text:

```
ZORK I: The Great Underground Empire
Copyright (c) 1981, 1982, 1983 Infocom, Inc. All rights reserved.
ZORK is a registered trademark of Infocom, Inc.

West of House
You are standing in an open field west of a white house, with a boarded front door.
There is a small mailbox here.

>
```

### Basic Commands
- `look` - Look around
- `inventory` or `i` - Check your inventory
- `north`, `south`, `east`, `west`, `up`, `down` - Move
- `take <object>` - Pick up an object
- `drop <object>` - Drop an object
- `examine <object>` or `x <object>` - Examine something
- `open <object>` - Open something
- `read <object>` - Read something
- `save` - Save your game
- `restore` - Load a saved game
- `quit` - Exit the game

### Tips
- Explore everywhere
- Examine everything
- Try different commands
- Save often!
- The game has a sense of humor

### Getting Help
- Type `help` in the game for basic commands
- Consult online walkthroughs if stuck (but try to solve puzzles yourself first!)

---

## Save Files

Save files are stored in the same directory as the executable or where you run the game from.

### Save Format
- Files are saved as JSON
- Default extension: `.json`
- Example: `my-save.json`

### Backing Up Saves
Simply copy your `.json` save files to a safe location.

---

## Uninstallation

### macOS
Delete the folder containing the `zork` executable.

If you added it to PATH:
```bash
sudo rm /usr/local/bin/zork
```

### Windows
Delete the folder containing `zork.exe`.

If you added it to PATH, remove the entry from Environment Variables.

---

## System Requirements

### Minimum
- **macOS:** 10.15 (Catalina) or later
- **Windows:** Windows 10 or later
- **RAM:** 100 MB
- **Disk Space:** 100 MB

### Recommended
- **macOS:** 11.0 (Big Sur) or later
- **Windows:** Windows 11
- **Terminal:** Windows Terminal (Windows) or default Terminal (macOS)

---

## Support

### Issues
If you encounter problems:
1. Check the troubleshooting section above
2. Verify your system meets the requirements
3. Try running from a terminal/command prompt
4. Check for error messages

### Known Issues
- One property-based test may fail (does not affect gameplay)
- TypeScript compilation shows warnings (does not affect runtime)

---

## License

This is a modern rewrite of the classic Zork I game. See LICENSE file for details.

---

## Enjoy!

Have fun exploring the Great Underground Empire!

```
> take lamp
> open mailbox
> read leaflet
> north
```

Good luck, adventurer!
