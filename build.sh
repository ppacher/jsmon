#!/bin/bash

npm install rxjs

base=$(pwd)

buildPackage() {
    cd ${base}/packages/$1

    npm start

    cd ${base}
}

buildApp() {
    cd ${base}/$1

    shift

    npm install
    npm start -- $@

    cd ${base}
}

skipLibs=false

if [ "$1" == "--skip-libs" ]; then
    skipLibs=true
    shift
fi

if [ $skipLibs == false ]; then
    buildPackage core
    buildPackage plugin-httpserver
    buildPackage plugin-mpd
    buildPackage plugin-mqtt
    buildPackage plugin-sysinfo
    buildPackage plugin-graphql
    buildPackage plugin-darkskynet
    buildPackage plugin-firetv
fi

for app in "$@"; do
    buildApp $app
done