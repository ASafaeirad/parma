#!/bin/sh

echo "Start Orgs, CLI, CI and Couch db."

# Start CA peers
export CA1_PRIVATE_KEY=$(cd crypto-config/peerOrganizations/org1.example.com/ca && ls *_sk)
export CA2_PRIVATE_KEY=$(cd crypto-config/peerOrganizations/org2.example.com/ca && ls *_sk)

docker-compose \
  -f docker-compose-cli.yaml \
  -f docker-compose-ca.yaml \
  -f docker-compose-couch.yaml \
  up -d
