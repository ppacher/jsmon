#!/bin/bash

publish=false
base=$(dirname $0)

if [ "$1" == "--publish" ]; then
    publish=true
    shift
fi

buildPlugin() {
    echo "Building $1"
    pushd ${base}/packages/plugins/$1
    
    npm start || exit

    if [ $publish == true ]; then 
        npm publish -f ./dist
    fi 

    popd
}

buildPlatform() {
    echo "Building $1"
    pushd ${base}/packages/platforms/$1
    
    npm start || exit

    if [ $publish == true ]; then 
        npm publish -f ./dist
    fi 

    popd
}

buildPackage() {
    echo "Building $1"
    pushd ${base}/packages/$1
    
    npm start || exit

    if [ $publish == true ]; then 
        npm publish -f ./dist
    fi 

    popd
}

for pkg in $@ ; do 
    if [[ $pkg == plugin* ]]; then
        buildPlugin $pkg
        continue
    fi
    
    if [[ $pkg == platform* ]]; then
        buildPlatform $pkg
        continue
    fi
    
    buildPackage $pkg
done