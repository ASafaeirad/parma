#!/bin/bash

PATH="../bin/:$PATH"
CHANNEL_NAME=mychannel
export CA1_PRIVATE_KEY
export CA2_PRIVATE_KEY

artifacts() {
  echo "Generate crypto artifacts."
  cryptogen generate --config=./crypto-config.yaml

  echo "Generate genesis block"
  configtxgen \
    -profile TwoOrgsOrdererGenesis \
    -channelID byfn-sys-channel \
    -outputBlock ./channel-artifacts/genesis.block

  echo "Generate channel transaction artifacts."
  configtxgen \
    -profile TwoOrgsChannel \
    -outputCreateChannelTx ./channel-artifacts/channel.tx \
    -channelID $CHANNEL_NAME
}

anchorpeer() {
  echo "Define anchorpeer for Org1."
  configtxgen \
    -profile TwoOrgsChannel \
    -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors.tx \
    -channelID $CHANNEL_NAME \
    -asOrg Org1MSP

  echo "Define anchorpeer for Org2."
  configtxgen \
    -profile TwoOrgsChannel \
    -outputAnchorPeersUpdate ./channel-artifacts/Org2MSPanchors.tx \
    -channelID $CHANNEL_NAME \
    -asOrg Org2MSP
}

up() {
  echo "Start network"

  CA1_PRIVATE_KEY=$(cd crypto-config/peerOrganizations/org1.example.com/ca && ls *_sk)
  CA2_PRIVATE_KEY=$(cd crypto-config/peerOrganizations/org2.example.com/ca && ls *_sk)

  docker-compose \
    -f docker-compose-cli.yaml \
    -f docker-compose-ca.yaml \
    -f docker-compose-couch.yaml \
    up -d
}

down() {
  echo "Stop Orgs, CLI, CI and Couch db."
  docker-compose \
    -f docker-compose-cli.yaml \
    -f docker-compose-ca.yaml \
    -f docker-compose-couch.yaml \
    down
}

teardonw() {
  docker rm -f "$(docker ps -aq)"
  docker volume prune
  docker network prune
}

MODE=$1

case "$MODE" in
"start")
  artifacts
  anchorpeer
  up
  ;;
"stop")
  down
  ;;
"teardown")
  down
  teardonw
  ;;
*)
  echo "Wrong command"
  ;;
esac
