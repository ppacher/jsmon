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
    buildPackage plugins/plugin-httpserver
    buildPackage plugins/plugin-mqtt
    buildPackage plugins/plugin-graphql
    buildPackage platforms/platform-mpd
    buildPackage platforms/platform-darkskynet
    buildPackage platforms/platform-sysinfo
    buildPackage platforms/platform-firetv
fi

for app in "$@"; do
    buildApp $app
done