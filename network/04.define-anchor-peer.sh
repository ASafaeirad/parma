#!/bin/sh

echo "Define anchorpeer for Org1."

# Define the anchor peer for Org1 on the channel that we are constructing
configtxgen \
  -profile TwoOrgsChannel \
  -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors.tx \
  -channelID $CHANNEL_NAME -asOrg Org1MSP

echo "Define anchorpeer for Org2."

# Define the anchor peer for Org2 on the channel that we are constructing
configtxgen \
  -profile TwoOrgsChannel \
  -outputAnchorPeersUpdate ./channel-artifacts/Org2MSPanchors.tx \
  -channelID $CHANNEL_NAME \
  -asOrg Org2MSP
