#!/bin/bash

echo "🎙️  Starting Aphorism Echo..."
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    python3 server.py
elif command -v python &> /dev/null; then
    python server.py
else
    echo "❌ Python is not installed or not in PATH"
    echo "Please install Python 3 and try again"
    echo ""
    echo "Alternative: Open index.html directly in your browser"
    exit 1
fi 