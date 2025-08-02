#!/bin/bash

# Clean build directories
echo "Cleaning build directories..."

if [ -d "dist" ]; then
    rm -rf dist
    echo "Removed dist/"
fi

if [ -d "dist-mocked" ]; then
    rm -rf dist-mocked
    echo "Removed dist-mocked/"
fi

echo "Build directories cleaned."