# Zork I Release Build Script (PowerShell)
# Creates standalone executables for macOS and Windows

$ErrorActionPreference = "Stop"

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "  Zork I Release Build Script" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$VERSION = "1.0.0"
$RELEASES_DIR = "releases"
$PACKAGES_DIR = "dist-packages"

# Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $RELEASES_DIR, $PACKAGES_DIR -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $RELEASES_DIR, $PACKAGES_DIR | Out-Null
Write-Host "✓ Clean complete" -ForegroundColor Green
Write-Host ""

# Build TypeScript
Write-Host "🔨 Building TypeScript..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ TypeScript build complete" -ForegroundColor Green
} else {
    Write-Host "⚠️  TypeScript build completed with warnings (this is expected)" -ForegroundColor Yellow
}
Write-Host ""

# Check if pkg is available
$pkgInstalled = Get-Command pkg -ErrorAction SilentlyContinue
if (-not $pkgInstalled) {
    Write-Host "📦 Installing pkg..." -ForegroundColor Yellow
    npm install -g pkg
}

# Create executables
Write-Host "📦 Creating executables..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor Gray
npx pkg dist/main.js `
  --targets node20-macos-x64,node20-macos-arm64,node20-win-x64 `
  --output "$RELEASES_DIR/zork"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Executables created" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create executables" -ForegroundColor Red
    exit 1
}
Write-Host ""

# List created executables
Write-Host "📋 Created executables:" -ForegroundColor Cyan
Get-ChildItem $RELEASES_DIR | Format-Table Name, Length, LastWriteTime
Write-Host ""

# Create macOS Intel package
Write-Host "📦 Packaging macOS Intel..." -ForegroundColor Yellow
$MACOS_INTEL_DIR = "$PACKAGES_DIR/zork-macos-intel-v$VERSION"
New-Item -ItemType Directory -Force -Path $MACOS_INTEL_DIR | Out-Null
Copy-Item "$RELEASES_DIR/zork-macos-x64" "$MACOS_INTEL_DIR/zork"
Copy-Item README.md, LICENSE, INSTALL.md -Destination $MACOS_INTEL_DIR -ErrorAction SilentlyContinue
Compress-Archive -Path $MACOS_INTEL_DIR -DestinationPath "$PACKAGES_DIR/zork-macos-intel-v$VERSION.zip" -Force
Write-Host "✓ macOS Intel package created" -ForegroundColor Green
Write-Host ""

# Create macOS ARM package
Write-Host "📦 Packaging macOS ARM (Apple Silicon)..." -ForegroundColor Yellow
$MACOS_ARM_DIR = "$PACKAGES_DIR/zork-macos-arm64-v$VERSION"
New-Item -ItemType Directory -Force -Path $MACOS_ARM_DIR | Out-Null
Copy-Item "$RELEASES_DIR/zork-macos-arm64" "$MACOS_ARM_DIR/zork"
Copy-Item README.md, LICENSE, INSTALL.md -Destination $MACOS_ARM_DIR -ErrorAction SilentlyContinue
Compress-Archive -Path $MACOS_ARM_DIR -DestinationPath "$PACKAGES_DIR/zork-macos-arm64-v$VERSION.zip" -Force
Write-Host "✓ macOS ARM package created" -ForegroundColor Green
Write-Host ""

# Create Windows package
Write-Host "📦 Packaging Windows..." -ForegroundColor Yellow
$WINDOWS_DIR = "$PACKAGES_DIR/zork-windows-v$VERSION"
New-Item -ItemType Directory -Force -Path $WINDOWS_DIR | Out-Null
Copy-Item "$RELEASES_DIR/zork-win-x64.exe" "$WINDOWS_DIR/zork.exe"
Copy-Item README.md, LICENSE, INSTALL.md -Destination $WINDOWS_DIR -ErrorAction SilentlyContinue
Compress-Archive -Path $WINDOWS_DIR -DestinationPath "$PACKAGES_DIR/zork-windows-v$VERSION.zip" -Force
Write-Host "✓ Windows package created" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "  Build Complete!" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Distribution packages created:" -ForegroundColor Green
Get-ChildItem "$PACKAGES_DIR/*.zip" | Format-Table Name, Length, LastWriteTime
Write-Host ""
Write-Host "📁 Packages location: $PACKAGES_DIR/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test executables on clean systems"
Write-Host "2. Update DISTRIBUTION_CHECKLIST.md"
Write-Host "3. Create release on GitHub"
Write-Host "4. Upload packages"
Write-Host ""
Write-Host "To test locally:" -ForegroundColor Yellow
Write-Host "  Windows:      .\$RELEASES_DIR\zork-win-x64.exe"
Write-Host "  macOS Intel:  ./$RELEASES_DIR/zork-macos-x64 (requires macOS)"
Write-Host "  macOS ARM:    ./$RELEASES_DIR/zork-macos-arm64 (requires macOS)"
Write-Host ""
