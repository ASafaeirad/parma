#!/bin/bash
WARN='\033[0;33m'
CYAN='\033[1;36m'
RED='\033[0;32m'
NC='\033[0m'

title() {
  echo
  echo -e "${CYAN}==============================${NC}"
  echo -e "${CYAN}${1}${NC}"
  echo -e "${CYAN}==============================${NC}"
  echo
}

set -e

# don't rewrite paths for Windows Git Bash users
starttime=$(date +%s)

CC_RUNTIME=node
CC_SRC_PATH=/opt/gopath/src/github.com/chaincode/

echo Compiling TypeScript code into JavaScript ...
pushd ../chaincode
npm install
# npm run build
popd
# echo Finished compiling TypeScript code into JavaScript

# launch network; create channel and join peer to channel
pushd ../network
echo y | ./network.sh teardown
echo y | ./network.sh start
echo y | ./network.sh init

CONFIG_ROOT=/opt/gopath/src/github.com/hyperledger/fabric/peer
ORG1_MSPCONFIGPATH=${CONFIG_ROOT}/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
ORG1_TLS_ROOTCERT_FILE=${CONFIG_ROOT}/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
ORG2_MSPCONFIGPATH=${CONFIG_ROOT}/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
ORG2_TLS_ROOTCERT_FILE=${CONFIG_ROOT}/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
ORDERER_TLS_ROOTCERT_FILE=${CONFIG_ROOT}/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

title "Installing smart contract on peer0.org1.example.com"
set -x
docker exec \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 \
  -e CORE_PEER_MSPCONFIGPATH=${ORG1_MSPCONFIGPATH} \
  -e CORE_PEER_TLS_ROOTCERT_FILE=${ORG1_TLS_ROOTCERT_FILE} \
  cli \
  peer chaincode install \
  -n parma \
  -v 1.0 \
  -p "$CC_SRC_PATH" \
  -l "$CC_RUNTIME"
set +x

title "Installing smart contract on peer0.org2.example.com"
set -x
docker exec \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_ADDRESS=peer0.org2.example.com:9051 \
  -e CORE_PEER_MSPCONFIGPATH=${ORG2_MSPCONFIGPATH} \
  -e CORE_PEER_TLS_ROOTCERT_FILE=${ORG2_TLS_ROOTCERT_FILE} \
  cli \
  peer chaincode install \
  -n parma \
  -v 1.0 \
  -p "$CC_SRC_PATH" \
  -l "$CC_RUNTIME"
set +x

title "Instantiating smart contract on mychannel"
set -x
docker exec \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_MSPCONFIGPATH=${ORG1_MSPCONFIGPATH} \
  cli \
  peer chaincode instantiate \
  -o orderer.example.com:7050 \
  -C mychannel \
  -n parma \
  -l "$CC_RUNTIME" \
  -v 1.0 \
  -c '{"Args":[]}' \
  -P "AND('Org1MSP.member','Org2MSP.member')" \
  --tls \
  --cafile ${ORDERER_TLS_ROOTCERT_FILE} \
  --peerAddresses peer0.org1.example.com:7051 \
  --tlsRootCertFiles ${ORG1_TLS_ROOTCERT_FILE}
set +x

title "Waiting for instantiation request to be committed ..."
sleep 10

title "Submitting initLedger transaction to smart contract on mychannel"
title "The transaction is sent to the two peers with the chaincode installed (peer0.org1.example.com and peer0.org2.example.com) so that chaincode is built before receiving the following requests"
set -x
docker exec \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_MSPCONFIGPATH=${ORG1_MSPCONFIGPATH} \
  cli \
  peer chaincode invoke \
  -o orderer.example.com:7050 \
  -C mychannel \
  -n parma \
  --waitForEvent \
  --tls \
  --cafile ${ORDERER_TLS_ROOTCERT_FILE} \
  --peerAddresses peer0.org1.example.com:7051 \
  --peerAddresses peer0.org2.example.com:9051 \
  --tlsRootCertFiles ${ORG1_TLS_ROOTCERT_FILE} \
  --tlsRootCertFiles ${ORG2_TLS_ROOTCERT_FILE} \
  -c '{"function":"initLedger","Args":[]}'

set +x

popd
# clean the keystore
rm -rf ./wallet
node ./enrollAdmin.js && node ./registerUser.js
