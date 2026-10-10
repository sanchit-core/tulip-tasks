#!/usr/bin/env bash
#
# Tulip Tasks local installation script
# Installs the app into ~/.local/ without system-wide changes
#
# Usage: ./install-tulip-tasks.sh
#        OR  bash install-tulip-tasks.sh
#

set -euo pipefail

APP_NAME="tulip-tasks"
APP_VER="0.1.5"
APP_ARCH="x86_64"
REPO="sanchit-core/tulip-tasks"

# Determine the system architecture
if [ -z "${ARCH:-}" ]; then
    ARCH="$(uname -m)"
    case "$ARCH" in
        x86_64) ARCH="x86_64" ;;
        aarch64|armv8l) ARCH="aarch64" ;;
        *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
    esac
fi

INSTALL_DIR="$HOME/.local/tulip-tasks"
BIN_DIR="$HOME/.local/bin"

# Create directories
mkdir -p "$INSTALL_DIR"
mkdir -p "$BIN_DIR"

echo "=== Tulip Tasks $APP_VER Installation ==="
echo "Installation directory: $INSTALL_DIR"
echo ""

# Download the latest AppImage from GitHub releases
LATEST_RELEASE_URL="https://api.github.com/repos/$REPO/releases/latest"
echo "Fetching latest release information..."

if command -v curl &>/dev/null; then
    RELEASE_INFO=$(curl -sL "$LATEST_RELEASE_URL")
elif command -v wget &>/dev/null; then
    RELEASE_INFO=$(wget -qO- "$LATEST_RELEASE_URL")
else
    echo "Error: Neither curl nor wget is available. Please install one of them."
    exit 1
fi

# Extract the AppImage URL for the correct architecture
if [ "$ARCH" = "x86_64" ]; then
    APPIMAGE_URL=$(echo "$RELEASE_INFO" | grep -oP '"browser_download_url": "\K.*linux_x86_64\.AppImage' | head -1)
else
    APPIMAGE_URL=$(echo "$RELEASE_INFO" | grep -oP '"browser_download_url": "\K.*aarch64\.AppImage' | head -1)
fi

if [ -z "$APPIMAGE_URL" ]; then
    echo "Error: Could not determine AppImage URL for $ARCH architecture."
    echo "Available assets: $(echo "$RELEASE_INFO" | grep -oP '"name": "\K[^"]+' | tr '\n' ' ')"
    exit 1
fi

echo "Downloading AppImage from: $APPIMAGE_URL"
echo ""

# Download the AppImage
APPIMAGE_FILE="$INSTALL_DIR/tulip-tasks-$APP_VER-$ARCH.AppImage"
if command -v curl &>/dev/null; then
    curl -L "$APPIMAGE_URL" -o "$APPIMAGE_FILE"
elif command -v wget &>/dev/null; then
    wget -q "$APPIMAGE_URL" -O "$APPIMAGE_FILE"
fi

if [ ! -f "$APPIMAGE_FILE" ]; then
    echo "Error: Failed to download AppImage."
    exit 1
fi

echo "AppImage downloaded successfully: $(basename "$APPIMAGE_FILE")"
echo ""

# Make the AppImage executable
chmod +x "$APPIMAGE_FILE"

echo "Made AppImage executable."
echo ""

# Create symlink in .local/bin
ln -sf "$APPIMAGE_FILE" "$BIN_DIR/$APP_NAME"

echo "Created symlink: $BIN_DIR/$APP_NAME -> $APPIMAGE_FILE"
echo ""

# Create a desktop entry directory if needed
DESKTOP_DIR="$HOME/.local/share/applications"
mkdir -p "$DESKTOP_DIR"

# Create a .desktop file for the application
cat > "$DESKTOP_DIR/tulip-tasks.desktop" << DESKTOP_EOF
[Desktop Entry]
Name=Tulip Tasks
Comment=A neo-brutalist task board with calendar, backlog inbox and recurring tasks
Exec=$BIN_DIR/$APP_NAME
Terminal=false
Type=Application
Categories=Utility;Organization;
Icon=tulip-tasks
DESKTOP_EOF

chmod +x "$DESKTOP_DIR/tulip-tasks.desktop"
echo "Created desktop entry: $DESKTOP_DIR/tulip-tasks.desktop"
echo ""

# Update PATH in shell profile if needed
SHELL_RC="$HOME/.bashrc"
if [ -f "$SHELL_RC" ] && ! grep -q "HOME/.local/bin" "$SHELL_RC"; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$SHELL_RC"
    echo "Added \$HOME/.local/bin to PATH in $SHELL_RC"
fi

SHELL_RC="$HOME/.zshrc"
if [ -f "$SHELL_RC" ] && ! grep -q "HOME/.local/bin" "$SHELL_RC"; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$SHELL_RC"
    echo "Added \$HOME/.local/bin to PATH in $SHELL_RC"
fi

echo "=== Installation Complete ==="
echo ""
echo "Tulip Tasks is now installed in ~/.local/"
echo "You can launch it from terminal with: tulip-tasks"
echo "Or via your application menu (if using a desktop environment)"
echo ""
echo "To update later, re-run this script."
echo ""
echo "Enjoy your task board! 🎯"