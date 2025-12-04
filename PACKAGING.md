# Packaging and Distribution Guide

This guide explains how to create standalone executables for macOS and Windows.

## Packaging Strategy

We'll use **pkg** (https://github.com/vercel/pkg) to create standalone executables that bundle Node.js with the application.

## Prerequisites

Install pkg globally:
```bash
npm install -g pkg
```

Or use npx (no installation required):
```bash
npx pkg --version
```

## Package Configuration

Add to `package.json`:

```json
{
  "bin": "dist/main.js",
  "pkg": {
    "targets": [
      "node20-macos-x64",
      "node20-macos-arm64",
      "node20-win-x64"
    ],
    "outputPath": "releases"
  }
}
```

## Building Executables

### Step 1: Build TypeScript
```bash
npm run build
```

### Step 2: Create Executables

#### For macOS (Intel):
```bash
npx pkg dist/main.js --target node20-macos-x64 --output releases/zork-macos-intel
```

#### For macOS (Apple Silicon):
```bash
npx pkg dist/main.js --target node20-macos-arm64 --output releases/zork-macos-arm64
```

#### For Windows:
```bash
npx pkg dist/main.js --target node20-win-x64 --output releases/zork-windows.exe
```

#### Build All Platforms:
```bash
npx pkg dist/main.js --targets node20-macos-x64,node20-macos-arm64,node20-win-x64 --output releases/zork
```

This creates:
- `releases/zork-macos-x64`
- `releases/zork-macos-arm64`
- `releases/zork-win-x64.exe`

## Testing Packaged Executables

### macOS:
```bash
chmod +x releases/zork-macos-*
./releases/zork-macos-arm64
```

### Windows:
```cmd
releases\zork-windows.exe
```

## Distribution Package Structure

Create distribution packages with the following structure:

```
zork-macos-v1.0.0/
├── zork                    # Executable
├── README.md              # Installation instructions
├── LICENSE                # License file
└── saves/                 # Directory for save files (optional)

zork-windows-v1.0.0/
├── zork.exe               # Executable
├── README.txt             # Installation instructions
├── LICENSE.txt            # License file
└── saves/                 # Directory for save files (optional)
```

## Creating Distribution Archives

### macOS:
```bash
# Intel
mkdir -p dist-packages/zork-macos-intel-v1.0.0
cp releases/zork-macos-x64 dist-packages/zork-macos-intel-v1.0.0/zork
cp README.md LICENSE dist-packages/zork-macos-intel-v1.0.0/
cd dist-packages
tar -czf zork-macos-intel-v1.0.0.tar.gz zork-macos-intel-v1.0.0
cd ..

# Apple Silicon
mkdir -p dist-packages/zork-macos-arm64-v1.0.0
cp releases/zork-macos-arm64 dist-packages/zork-macos-arm64-v1.0.0/zork
cp README.md LICENSE dist-packages/zork-macos-arm64-v1.0.0/
cd dist-packages
tar -czf zork-macos-arm64-v1.0.0.tar.gz zork-macos-arm64-v1.0.0
cd ..
```

### Windows:
```bash
mkdir -p dist-packages/zork-windows-v1.0.0
cp releases/zork-win-x64.exe dist-packages/zork-windows-v1.0.0/zork.exe
cp README.md LICENSE dist-packages/zork-windows-v1.0.0/
cd dist-packages
zip -r zork-windows-v1.0.0.zip zork-windows-v1.0.0
cd ..
```

## Automated Build Script

Save as `build-releases.sh`:

```bash
#!/bin/bash

echo "=== Building Zork I Releases ==="

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf releases dist-packages
mkdir -p releases dist-packages

# Build TypeScript
echo "Building TypeScript..."
npm run build

# Create executables
echo "Creating executables..."
npx pkg dist/main.js \
  --targets node20-macos-x64,node20-macos-arm64,node20-win-x64 \
  --output releases/zork

# Create macOS Intel package
echo "Packaging macOS Intel..."
mkdir -p dist-packages/zork-macos-intel-v1.0.0
cp releases/zork-macos-x64 dist-packages/zork-macos-intel-v1.0.0/zork
chmod +x dist-packages/zork-macos-intel-v1.0.0/zork
cp README.md LICENSE dist-packages/zork-macos-intel-v1.0.0/
cd dist-packages
tar -czf zork-macos-intel-v1.0.0.tar.gz zork-macos-intel-v1.0.0
cd ..

# Create macOS ARM package
echo "Packaging macOS ARM..."
mkdir -p dist-packages/zork-macos-arm64-v1.0.0
cp releases/zork-macos-arm64 dist-packages/zork-macos-arm64-v1.0.0/zork
chmod +x dist-packages/zork-macos-arm64-v1.0.0/zork
cp README.md LICENSE dist-packages/zork-macos-arm64-v1.0.0/
cd dist-packages
tar -czf zork-macos-arm64-v1.0.0.tar.gz zork-macos-arm64-v1.0.0
cd ..

# Create Windows package
echo "Packaging Windows..."
mkdir -p dist-packages/zork-windows-v1.0.0
cp releases/zork-win-x64.exe dist-packages/zork-windows-v1.0.0/zork.exe
cp README.md LICENSE dist-packages/zork-windows-v1.0.0/
cd dist-packages
zip -r zork-windows-v1.0.0.zip zork-windows-v1.0.0
cd ..

echo "=== Build Complete ==="
echo "Packages created in dist-packages/"
ls -lh dist-packages/*.tar.gz dist-packages/*.zip
```

Make executable:
```bash
chmod +x build-releases.sh
./build-releases.sh
```

## Windows Build Script

Save as `build-releases.ps1`:

```powershell
Write-Host "=== Building Zork I Releases ===" -ForegroundColor Cyan

# Clean previous builds
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
Remove-Item -Recurse -Force releases, dist-packages -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path releases, dist-packages | Out-Null

# Build TypeScript
Write-Host "Building TypeScript..." -ForegroundColor Yellow
npm run build

# Create executables
Write-Host "Creating executables..." -ForegroundColor Yellow
npx pkg dist/main.js `
  --targets node20-macos-x64,node20-macos-arm64,node20-win-x64 `
  --output releases/zork

# Create Windows package
Write-Host "Packaging Windows..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path dist-packages/zork-windows-v1.0.0 | Out-Null
Copy-Item releases/zork-win-x64.exe dist-packages/zork-windows-v1.0.0/zork.exe
Copy-Item README.md, LICENSE dist-packages/zork-windows-v1.0.0/
Compress-Archive -Path dist-packages/zork-windows-v1.0.0 -DestinationPath dist-packages/zork-windows-v1.0.0.zip

Write-Host "=== Build Complete ===" -ForegroundColor Green
Write-Host "Packages created in dist-packages/" -ForegroundColor Yellow
Get-ChildItem dist-packages/*.zip
```

Run with:
```powershell
powershell -ExecutionPolicy Bypass -File build-releases.ps1
```

## Installation Instructions for Users

### macOS Installation

Create `INSTALL-MACOS.md`:

```markdown
# Zork I - macOS Installation

## Requirements
- macOS 10.15 or later
- No additional software required (Node.js is bundled)

## Installation

1. Download the appropriate version:
   - Intel Macs: `zork-macos-intel-v1.0.0.tar.gz`
   - Apple Silicon (M1/M2/M3): `zork-macos-arm64-v1.0.0.tar.gz`

2. Extract the archive:
   ```bash
   tar -xzf zork-macos-*.tar.gz
   cd zork-macos-*
   ```

3. Make executable (if needed):
   ```bash
   chmod +x zork
   ```

4. Run the game:
   ```bash
   ./zork
   ```

## Optional: Add to PATH

To run from anywhere:
```bash
sudo cp zork /usr/local/bin/
```

Then run with:
```bash
zork
```

## Troubleshooting

### "Cannot be opened because the developer cannot be verified"
Right-click the file and select "Open", then click "Open" in the dialog.

Or use Terminal:
```bash
xattr -d com.apple.quarantine zork
```

### Permission Denied
```bash
chmod +x zork
```
```

### Windows Installation

Create `INSTALL-WINDOWS.md`:

```markdown
# Zork I - Windows Installation

## Requirements
- Windows 10 or later
- No additional software required (Node.js is bundled)

## Installation

1. Download `zork-windows-v1.0.0.zip`

2. Extract the ZIP file to a folder of your choice

3. Double-click `zork.exe` to run

## Optional: Add to PATH

To run from any Command Prompt:

1. Copy `zork.exe` to a permanent location (e.g., `C:\Program Files\Zork\`)
2. Add that folder to your PATH:
   - Search for "Environment Variables" in Windows
   - Edit "Path" variable
   - Add the folder containing zork.exe
   - Click OK

Then run from any Command Prompt:
```cmd
zork
```

## Troubleshooting

### Windows Defender Warning
Windows may show a warning for unsigned executables. Click "More info" then "Run anyway".

### Antivirus Blocking
Some antivirus software may flag the executable. Add an exception if needed.

### Terminal Not Found
The game requires a terminal. Use:
- Command Prompt (cmd.exe)
- PowerShell
- Windows Terminal (recommended)
```

## File Size Expectations

Packaged executables will be approximately:
- macOS: 40-50 MB (includes Node.js runtime)
- Windows: 40-50 MB (includes Node.js runtime)

## Testing Packaged Versions

### On Clean Systems

Test on systems without Node.js installed to verify:
- [ ] Executable runs without Node.js
- [ ] All game features work
- [ ] Save/restore functionality works
- [ ] No missing dependencies
- [ ] Performance is acceptable

### Verification Checklist

- [ ] Executable starts without errors
- [ ] Game displays opening text
- [ ] Commands work correctly
- [ ] Save creates file
- [ ] Restore loads file
- [ ] CTRL+C exits gracefully
- [ ] File size is reasonable (< 100MB)

## Distribution Checklist

Before releasing:
- [ ] Test on clean macOS system
- [ ] Test on clean Windows system
- [ ] Verify all platforms work
- [ ] Include README and LICENSE
- [ ] Create installation instructions
- [ ] Test installation process
- [ ] Document known issues
- [ ] Create release notes

## Alternative: NPM Package

For users with Node.js installed, you can also distribute via npm:

```bash
npm install -g zork-rewrite
zork
```

This requires publishing to npm registry.

## Next Steps

1. Build executables for all platforms
2. Test on clean systems
3. Create distribution packages
4. Write installation instructions
5. Prepare release notes
6. Distribute to users
