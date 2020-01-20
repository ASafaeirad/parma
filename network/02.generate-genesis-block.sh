#!/bin/sh

echo "Generate genesis block"

# Generate Genesis Block
configtxgen \
  -profile TwoOrgsOrdererGenesis \
  -channelID byfn-sys-channel \
  -outputBlock ./channel-artifacts/genesis.block
