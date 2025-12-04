#!/bin/bash

# Zork I Release Build Script
# Creates standalone executables for macOS and Windows

set -e  # Exit on error

echo "==================================="
echo "  Zork I Release Build Script"
echo "==================================="
echo ""

# Configuration
VERSION="1.0.0"
RELEASES_DIR="releases"
PACKAGES_DIR="dist-packages"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf "$RELEASES_DIR" "$PACKAGES_DIR"
mkdir -p "$RELEASES_DIR" "$PACKAGES_DIR"
echo "✓ Clean complete"
echo ""

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build
if [ $? -eq 0 ]; then
    echo "✓ TypeScript build complete"
else
    echo "⚠️  TypeScript build completed with warnings (this is expected)"
fi
echo ""

# Check if pkg is available
if ! command -v pkg &> /dev/null; then
    echo "📦 Installing pkg..."
    npm install -g pkg
fi

# Create executables
echo "📦 Creating executables..."
echo "   This may take a few minutes..."
npx pkg dist/main.js \
  --targets node20-macos-x64,node20-macos-arm64,node20-win-x64 \
  --output "$RELEASES_DIR/zork"

if [ $? -eq 0 ]; then
    echo "✓ Executables created"
else
    echo "❌ Failed to create executables"
    exit 1
fi
echo ""

# List created executables
echo "📋 Created executables:"
ls -lh "$RELEASES_DIR"
echo ""

# Create macOS Intel package
echo "📦 Packaging macOS Intel..."
MACOS_INTEL_DIR="$PACKAGES_DIR/zork-macos-intel-v$VERSION"
mkdir -p "$MACOS_INTEL_DIR"
cp "$RELEASES_DIR/zork-macos-x64" "$MACOS_INTEL_DIR/zork"
chmod +x "$MACOS_INTEL_DIR/zork"
cp README.md LICENSE INSTALL.md "$MACOS_INTEL_DIR/" 2>/dev/null || echo "⚠️  Some documentation files not found"
cd "$PACKAGES_DIR"
tar -czf "zork-macos-intel-v$VERSION.tar.gz" "zork-macos-intel-v$VERSION"
cd ..
echo "✓ macOS Intel package created"
echo ""

# Create macOS ARM package
echo "📦 Packaging macOS ARM (Apple Silicon)..."
MACOS_ARM_DIR="$PACKAGES_DIR/zork-macos-arm64-v$VERSION"
mkdir -p "$MACOS_ARM_DIR"
cp "$RELEASES_DIR/zork-macos-arm64" "$MACOS_ARM_DIR/zork"
chmod +x "$MACOS_ARM_DIR/zork"
cp README.md LICENSE INSTALL.md "$MACOS_ARM_DIR/" 2>/dev/null || echo "⚠️  Some documentation files not found"
cd "$PACKAGES_DIR"
tar -czf "zork-macos-arm64-v$VERSION.tar.gz" "zork-macos-arm64-v$VERSION"
cd ..
echo "✓ macOS ARM package created"
echo ""

# Create Windows package
echo "📦 Packaging Windows..."
WINDOWS_DIR="$PACKAGES_DIR/zork-windows-v$VERSION"
mkdir -p "$WINDOWS_DIR"
cp "$RELEASES_DIR/zork-win-x64.exe" "$WINDOWS_DIR/zork.exe"
cp README.md LICENSE INSTALL.md "$WINDOWS_DIR/" 2>/dev/null || echo "⚠️  Some documentation files not found"
cd "$PACKAGES_DIR"
if command -v zip &> /dev/null; then
    zip -r "zork-windows-v$VERSION.zip" "zork-windows-v$VERSION"
    echo "✓ Windows package created"
else
    echo "⚠️  zip command not found, skipping Windows ZIP creation"
    echo "   You can manually create the ZIP file from: $WINDOWS_DIR"
fi
cd ..
echo ""

# Summary
echo "==================================="
echo "  Build Complete!"
echo "==================================="
echo ""
echo "📦 Distribution packages created:"
ls -lh "$PACKAGES_DIR"/*.tar.gz "$PACKAGES_DIR"/*.zip 2>/dev/null || true
echo ""
echo "📁 Packages location: $PACKAGES_DIR/"
echo ""
echo "Next steps:"
echo "1. Test executables on clean systems"
echo "2. Update DISTRIBUTION_CHECKLIST.md"
echo "3. Create release on GitHub"
echo "4. Upload packages"
echo ""
echo "To test locally:"
echo "  macOS Intel:  ./$RELEASES_DIR/zork-macos-x64"
echo "  macOS ARM:    ./$RELEASES_DIR/zork-macos-arm64"
echo "  Windows:      ./$RELEASES_DIR/zork-win-x64.exe (requires Windows)"
echo ""
