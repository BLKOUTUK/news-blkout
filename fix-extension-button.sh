#!/bin/bash
# BLKOUT Moderator Tools - Remove Floating Button
# This script creates a fixed version without the floating MODERATE button

set -e  # Exit on error

echo "🔧 BLKOUT Extension Fixer - Removing Floating Button"
echo "=================================================="
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PUBLIC_DIR="$SCRIPT_DIR/public"
ORIGINAL_ZIP="$PUBLIC_DIR/blkout-moderator-tools-v2.2.0.zip"
FIXED_ZIP="$PUBLIC_DIR/blkout-moderator-tools-v2.2.1-no-button.zip"
TEMP_DIR="/tmp/blkout-ext-fix-$$"

# Check if original exists
if [ ! -f "$ORIGINAL_ZIP" ]; then
    echo "❌ Error: Original extension not found at $ORIGINAL_ZIP"
    exit 1
fi

echo "📦 Step 1: Extracting original extension..."
mkdir -p "$TEMP_DIR"
unzip -q "$ORIGINAL_ZIP" -d "$TEMP_DIR"
echo "   ✓ Extracted to $TEMP_DIR"
echo ""

echo "✏️  Step 2: Patching content.js to remove floating button..."
CONTENT_JS="$TEMP_DIR/content/content.js"

if [ ! -f "$CONTENT_JS" ]; then
    echo "❌ Error: content.js not found at expected location"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Create backup
cp "$CONTENT_JS" "$CONTENT_JS.backup"

# Apply the fix using sed
sed -i 's/this\.injectQuickModeButton();/\/\/ REMOVED: this.injectQuickModeButton(); - Floating button disabled/' "$CONTENT_JS"

echo "   ✓ Patched content.js"
echo ""

echo "📋 Verifying the fix..."
if grep -q "REMOVED: this.injectQuickModeButton()" "$CONTENT_JS"; then
    echo "   ✓ Fix applied successfully!"
else
    echo "   ⚠️  Warning: Fix may not have applied correctly"
fi
echo ""

echo "📦 Step 3: Creating fixed extension package..."

# Try using Python's zipfile module
if command -v python3 &> /dev/null; then
    python3 << 'PYTHON_SCRIPT'
import os
import zipfile
import sys

temp_dir = os.environ.get('TEMP_DIR')
fixed_zip = os.environ.get('FIXED_ZIP')

try:
    with zipfile.ZipFile(fixed_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(temp_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, temp_dir)
                zipf.write(file_path, arcname)
    print(f"   ✓ Created fixed extension: {fixed_zip}")
except Exception as e:
    print(f"   ❌ Error creating zip: {e}")
    sys.exit(1)
PYTHON_SCRIPT

    if [ $? -ne 0 ]; then
        echo "   ❌ Python zip creation failed"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
else
    echo "   ❌ Error: python3 not found. Cannot create zip file."
    echo "   💡 Manual installation directory saved at: $TEMP_DIR"
    echo "      You can load this directly as an unpacked extension in Chrome."
    exit 0
fi

echo ""
echo "🧹 Step 4: Cleaning up temporary files..."
rm -rf "$TEMP_DIR"
echo "   ✓ Cleanup complete"
echo ""

echo "✅ SUCCESS! Fixed extension created."
echo ""
echo "📍 Location: $FIXED_ZIP"
echo ""
echo "📖 Installation Instructions:"
echo "   1. Go to chrome://extensions in your browser"
echo "   2. Remove the old 'BLKOUT Moderator Tools v2.2.0' extension"
echo "   3. Enable 'Developer mode' (toggle in top-right)"
echo "   4. Click 'Load unpacked'"
echo "   5. Extract the new ZIP file: $FIXED_ZIP"
echo "   6. Select the extracted folder"
echo ""
echo "🎉 The floating MODERATE button will be gone!"
echo "   Note: Keyboard shortcut (Ctrl+Shift+M) still works for quick access."
echo ""
