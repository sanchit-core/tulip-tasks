#!/usr/bin/env bash
#
# Tulip Tasks local installation script
# Installs the app into ~/.local/ without system-wide changes
#
# Usage: bash install-tulip-tasks.sh [--remove|-R]
#

set -euo pipefail

APP_NAME="tulip-tasks"
APP_VER="0.1.5"
APP_ARCH="x86_64"
REPO="sanchit-core/tulip-tasks"

# Parse arguments
REMOVE=false
while [[ $# -gt 0 ]]; do
    case "$1" in
        -R|--remove)
            REMOVE=true
            shift
            ;;
        --help|-h)
            echo "Usage: bash install-tulip-tasks.sh [--remove|-R]"
            echo ""
            echo "Options:"
            echo "  -R, --remove   Remove Tulip Tasks installation"
            echo "  --help, -h     Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# --- REMOVE MODE ---
if [ "$REMOVE" = true ]; then
    echo "=== Removing Tulip Tasks ==="

    # Remove desktop entry
    DESKTOP_DIR="$HOME/.local/share/applications"
    if [ -f "$DESKTOP_DIR/tulip-tasks.desktop" ]; then
        rm "$DESKTOP_DIR/tulip-tasks.desktop"
        echo "Removed desktop entry"
    fi

    # Remove symlink from bin
    BIN_DIR="$HOME/.local/bin"
    if [ -L "$BIN_DIR/$APP_NAME" ]; then
        rm "$BIN_DIR/$APP_NAME"
        echo "Removed symlink"
    fi

    # Remove installation directory
    INSTALL_DIR="$HOME/.local/tulip-tasks"
    if [ -d "$INSTALL_DIR" ]; then
        rm -rf "$INSTALL_DIR"
        echo "Removed installation directory"
    fi

    # Remove PATH entries from shell profiles
    for rc in "$HOME/.bashrc" "$HOME/.zshrc"; do
        if [ -f "$rc" ] && grep -q "HOME/.local/bin" "$rc"; then
            sed -i "/export PATH=\"\$HOME\/.local\/bin:\$PATH\"/d" "$rc"
        fi
    done

    echo "=== Removal Complete ==="
    echo "Tulip Tasks has been uninstalled from ~/.local/"
    exit 0
fi

# --- INSTALL MODE ---
echo "=== Tulip Tasks $APP_VER Installation ==="
echo "Installation directory: $HOME/.local/tulip-tasks"
echo ""

# Create directories
mkdir -p "$HOME/.local/tulip-tasks"
mkdir -p "$HOME/.local/bin"
mkdir -p "$HOME/.local/share/applications"

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
if [ "$APP_ARCH" = "x86_64" ]; then
    APPIMAGE_URL=$(echo "$RELEASE_INFO" | grep -oP '"browser_download_url": "\K.*linux_x86_64\.AppImage' | head -1)
else
    APPIMAGE_URL=$(echo "$RELEASE_INFO" | grep -oP '"browser_download_url": "\K.*aarch64\.AppImage' | head -1)
fi

if [ -z "$APPIMAGE_URL" ]; then
    echo "Error: Could not determine AppImage URL for $APP_ARCH architecture."
    exit 1
fi

echo "Downloading AppImage from: $APPIMAGE_URL"

# Download the AppImage
APPIMAGE_PATH="$HOME/.local/tulip-tasks/tulip-tasks_${APP_VER}_linux_${APP_ARCH}.AppImage"
if command -v curl &>/dev/null; then
    curl -L "$APPIMAGE_URL" -o "$APPIMAGE_PATH"
elif command -v wget &>/dev/null; then
    wget -q "$APPIMAGE_URL" -O "$APPIMAGE_PATH"
fi

if [ ! -f "$APPIMAGE_PATH" ]; then
    echo "Error: Failed to download AppImage."
    exit 1
fi

# Make AppImage executable
chmod +x "$APPIMAGE_PATH"

# Create wrapper script in $HOME/.local/bin
BIN_PATH="$HOME/.local/bin/tulip-tasks"
cat > "$BIN_PATH" << WRAPPER_EOF
#!/usr/bin/env bash
exec "$HOME/.local/tulip-tasks/tulip-tasks_${APP_VER}_linux_${APP_ARCH}.AppImage" "\$@"
WRAPPER_EOF
chmod +x "$BIN_PATH"

# Create .desktop entry with icon
DESKTOP_PATH="$HOME/.local/share/applications/tulip-tasks.desktop"
cat > "$DESKTOP_PATH" << DESKTOP_EOF
[Desktop Entry]
Name=Tulip Tasks
Comment=A neo-brutalist task board with calendar, backlog inbox and recurring tasks
Exec=tulip-tasks
Terminal=false
Type=Application
Icon=tulip-tasks
Categories=Utility;Organization;
X-Comment=Tulip Tasks $APP_VER
DESKTOP_EOF

# Try to set up a proper icon by extracting from AppImage or using default
ICON_SOURCE="$APPIMAGE_PATH"
if [ -f "$ICON_SOURCE" ]; then
    # Attempt to extract the .desktop file from the AppImage to get the icon
    ICON_EXTRACTED=$("$ICON_SOURCE" --appimage-extract 2>/dev/null || true)
    if [ -f "$HOME/.local/tulip-tasks/tulip-tasks.desktop" ]; then
        grep -oP '"Icon":? ?"\\K[^"]+' "$HOME/.local/tulip-tasks/tulip-tasks.desktop" 2>/dev/null | \
            while read -r icon_path; do
                if [ -n "$icon_path" ]; then
                    # Copy or link the icon to hicolor theme
                    ICON_DIR="$HOME/.local/share/icons/hicolor/256x256/apps"
                    mkdir -p "$ICON_DIR"
                    if echo "$icon_path" | grep -q "/"; then
                        # Absolute or relative path
                        cp "$icon_path" "$ICON_DIR/tulip-tasks.png" 2>/dev/null || true
                    else
                        # Just a name - try to find it
                        find / -name "$icon_path" -type f 2>/dev/null | head -1 | \
                            xargs -I{} cp {} "$ICON_DIR/tulip-tasks.png" 2>/dev/null || true
                    fi
                fi
            done
    fi
fi

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

# Also update system icon cache if possible
if command -v update-icon-caches &>/dev/null; then
    LOCAL_ICON_DIR="$HOME/.local/share/icons/hicolor"
    if [ -d "$LOCAL_ICON_DIR" ]; then
        update-icon-caches "$LOCAL_ICON_DIR" 2>/dev/null || true
    fi
fi

echo ""
echo "=== Installation Complete ==="
echo ""
echo "Tulip Tasks is now installed in ~/.local/"
echo "You can launch it from terminal with: tulip-tasks"
echo "Or via your application menu (if using a desktop environment)"
echo ""
echo "To update later, re-run this script."
echo ""
echo "To remove: bash install-tulip-tasks.sh -R"
echo ""
echo "Enjoy your task board! 🎯"