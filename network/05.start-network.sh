#!/bin/sh

# Start orderer and normal peers
docker-compose -f docker-compose-cli.yaml up -d

# Start CA peers
export CA1_PRIVATE_KEY=$(cd crypto-config/peerOrganizations/org1.example.com/ca && ls *_sk)
export CA2_PRIVATE_KEY=$(cd crypto-config/peerOrganizations/org2.example.com/ca && ls *_sk)
docker-compose -f docker-compose-ca.yaml up -d
