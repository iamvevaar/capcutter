#!/bin/bash
# This line tells the system this is a bash script

# Source the Emscripten environment
# Replace /path/to/emsdk with your actual emsdk installation path
# For example, if you installed it in your home directory:
source emsdk/emsdk_env.sh

# Create the output directory for WebAssembly files
mkdir -p public/wasm

# Compile the C++ code to WebAssembly
emcc src/core/engine/vector-engine.cpp \
     -I src/core/engine \
     -s WASM=1 \
     -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
     -s ALLOW_MEMORY_GROWTH=1 \
     -s MODULARIZE=1 \
     -O3 \
     -std=c++17 \
     --bind \
     -o public/wasm/vector-engine.js

# Check if compilation was successful
if [ $? -eq 0 ]; then
    echo "Compilation successful!"
    echo "Output files:"
    echo "  - public/wasm/vector-engine.js"
    echo "  - public/wasm/vector-engine.wasm"
else
    echo "Compilation failed!"
    exit 1
fi