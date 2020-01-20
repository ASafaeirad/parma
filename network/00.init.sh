#!/bin/sh

echo "Setting up env variables."

export PATH="../bin/:$PATH"
export FABRIC_CFG_PATH=$PWD
export CHANNEL_NAME=mychannel
