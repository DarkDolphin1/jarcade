#!/bin/bash
# Exit on error
set -e

echo "Skipping FreeJ2ME build (Using prebuilt binaries)..."

# Directory setup
BASE_DIR=$(pwd)
JAR_NAME="$BASE_DIR/freej2me.jar"

if [ ! -f "$JAR_NAME" ]; then
    echo "Warning: $JAR_NAME not found. Please ensure the prebuilt JAR is in the project root."
fi

echo "Environment ready."
