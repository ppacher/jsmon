#!/bin/bash

for pkg in core common example ; do
    echo "Building $pkg"
    
    pushd $pkg 2>/dev/null
    npm update && npm install && npm run build
    popd 2>/dev/null
done