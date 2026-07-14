#!/bin/bash

# Exit on error
set -e

echo "=== Wokwi IoT Gateway Downloader ==="
ARCH=$(uname -m)
OS=$(uname -s | tr '[:upper:]' '[:lower:]')

if [ "$OS" != "linux" ]; then
    echo "This script is designed for Linux. Your OS is: $OS"
    exit 1
fi

# Determine architecture suffix
ARCH_SUFFIX="Linux_64bit.zip"
if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
    ARCH_SUFFIX="Linux_ARM64.zip"
    echo "Detected ARM64 architecture..."
else
    echo "Detected x86_64 architecture..."
fi

echo "Fetching latest release information from GitHub API..."
LATEST_RELEASE_JSON=$(curl -s https://api.github.com/repos/wokwi/wokwigw/releases/latest)

# Extract the browser download URL matching the architecture
DOWNLOAD_URL=$(echo "$LATEST_RELEASE_JSON" | grep -o 'https://github.com/wokwi/wokwigw/releases/download/[^"]*' | grep "$ARCH_SUFFIX" | head -n 1)

if [ -z "$DOWNLOAD_URL" ]; then
    echo "Error: Could not find download URL for $ARCH_SUFFIX in the latest release."
    exit 1
fi

echo "Downloading from: $DOWNLOAD_URL"
curl -L -o "wokwigw.zip" "$DOWNLOAD_URL"

echo "Extracting binary..."
unzip -o wokwigw.zip

# Rename the platform-specific binary to 'wokwigw'
if [ -f "wokwigw-linux" ]; then
    mv -f wokwigw-linux wokwigw
elif [ -f "wokwigw-linux_arm64" ]; then
    mv -f wokwigw-linux_arm64 wokwigw
fi

echo "Setting executable permissions..."
chmod +x wokwigw

# Clean up zip file
rm -f wokwigw.zip

echo "=========================================="
echo "Successfully downloaded and configured Wokwi IoT Gateway!"
echo "To start the gateway, run the following command in this directory:"
echo ""
echo "    ./wokwigw"
echo "=========================================="
