#!/bin/sh

echo "Generate channel transaction artifacts."

# The channel.tx artifact contains the definitions for our sample channel
configtxgen \
  -profile TwoOrgsChannel \
  -outputCreateChannelTx ./channel-artifacts/channel.tx \
  -channelID $CHANNEL_NAME
