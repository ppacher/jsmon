#!/bin/bash

set -e

platforms=false
plugins=false
packages=false
projects=false
updateTypescript=false

lastlog=""

printErrorLog() {
    if [ "$lastlog" != "" ]; then
        echo -e "$lastlog"
    fi
}

trap printErrorLog EXIT

_setArgs(){
  while [ "${1:-}" != "" ]; do
    case "$1" in
      "-d" | "--platforms")
        platforms=true
        ;;
      "-p" | "--plugins")
        plugins=true
        ;;
      "-c" | "--packages")
        packages=true
        ;;
      "-b" | "--projects")
        projects=true
        ;;
      "-t" | "--typescript")
        updateTypescript=true
        ;;
      "-a" | "--all")
        platforms=true
        plugins=true
        packages=true
        projects=true
        ;;
    esac
    shift
  done
}

hasPackage() {
    local result=$(cat package.json | grep "$1")
    local name=$(cat package.json | jq '.name' -r)
    
    if [ "$name" == "$1" ]; then
        return 1
    fi

    if [ "$result" != "" ]; then
        return 0
    else
        return 1
    fi
}

updatePackage() {
    local version="$2"
    if [ "$version" == "" ]; then
        version="0.0.1"
    fi
    
    if hasPackage "$1" ; then 
        echo "      -> Updating '$1'"
        npm install --loglevel silent --no-summary --no-tree --silent --quiet --no-progress "$1"@"$version" 2>/dev/null >/dev/null
    fi
}

updateDependecies() {
    echo "   -> Updating dependencies"
    updatePackage "@jsmon/core" 
    updatePackage "@jsmon/platform"
    updatePackage "@jsmon/plugin-httpserver"
    updatePackage "@jsmon/plugin-mqtt"
    updatePackage "@jsmon/plugin-graphql"
    updatePackage "@jsmon/plugin-storage-file"
    updatePackage "@jsmon/platform-darkskynet"
    updatePackage "@jsmon/platform-firetv"
    updatePackage "@jsmon/platform-host-discovery"
    updatePackage "@jsmon/platform-mpd"
    updatePackage "@jsmon/platform-sysinfo"
}

rebuild() {
    echo "   -> Building package"
    if [ "$(cat package.json|grep '\"build\"')" != "" ]; then
        lastlog=$(npm run build)
    else
        lastlog=$(npm start)
    fi
}

publish() {
    echo "   -> Publishing package"
    npm publish --no-summary --no-tree --silent --quiet --no-progress -f ./dist 2>/dev/null >/dev/null
}

run() {
    for i in $@; do
        pushd $i 2>&1 >/dev/null

        echo -e "\e[33;1m>> $i\e[33;0m"
        
        if $updateTypescript; then
            updatePackage "typescript" "latest"
        fi

        updateDependecies
        rebuild
        publish

        popd 2>&1 >/dev/null
    done
}

_setArgs $@

if $packages ; then
    run ./packages/*
fi

if $plugins ; then
    run ./plugins/*
fi

if $platforms ; then
    run ./platforms/*
fi

if $projects ; then
    run ./projects/*
fi