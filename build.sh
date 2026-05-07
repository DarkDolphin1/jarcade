#!/bin/bash
# Exit on error
set -e

echo "Building FreeJ2ME..."

# Directory setup
BASE_DIR=$(pwd)
SOURCE_DIR="$BASE_DIR/emulator/src/freej2me"
BIN_DIR="$BASE_DIR/emulator/bin"
JAR_NAME="$BASE_DIR/freej2me.jar"

# Ensure we are in the right directory
cd "$BASE_DIR"

mkdir -p "$BIN_DIR"

# Find all Java files
find "$SOURCE_DIR" -name "*.java" > sources.txt

# Compile Java files
javac -d "$BIN_DIR" @sources.txt

# Remove temporary file
rm sources.txt

# Create the JAR
# org.recompile.freej2me.FreeJ2ME is the main class
jar cfe "$JAR_NAME" org.recompile.freej2me.FreeJ2ME -C "$BIN_DIR" .

echo "Build complete: $JAR_NAME"
