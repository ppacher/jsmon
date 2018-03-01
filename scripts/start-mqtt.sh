#!/bin/bash

PERSISTANCE=/home/$USER/homebot/_data

mkdir -p ${PERSISTANCE}/mqtt/{log,config,data}

docker run \
    --name mqtt \
    --restart=always \
    --net=host \
    -tid \
    -v ${PERSISTANCE}/mqtt/config:/mqtt/config:ro \
    -v ${PERSISTANCE}/mqtt/log:/mqtt/log \
    -v ${PERSISTANCE}/mqtt/data/:/mqtt/data/ \
    toke/mosquitto