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
npm run build
popd
echo Finished compiling TypeScript code into JavaScript

# clean the keystore
rm -rf ./hfc-key-store

# launch network; create channel and join peer to channel
cd ../network
echo y | ./network.sh teardown
echo y | ./network.sh start

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
  -c '{"function":"initLedger","Args":[]}' \
  --waitForEvent \
  --tls \
  --cafile ${ORDERER_TLS_ROOTCERT_FILE} \
  --peerAddresses peer0.org1.example.com:7051 \
  --peerAddresses peer0.org2.example.com:9051 \
  --tlsRootCertFiles ${ORG1_TLS_ROOTCERT_FILE} \
  --tlsRootCertFiles ${ORG2_TLS_ROOTCERT_FILE}
set +x

cat <<EOF

Total setup execution time : $(($(date +%s) - starttime)) secs ...

Next, use the FabCar applications to interact with the deployed FabCar contract.
The FabCar applications are available in multiple programming languages.
Follow the instructions for the programming language of your choice:

JavaScript:

  Start by changing into the "javascript" directory:
    cd javascript

  Next, install all required packages:
    npm install

  Then run the following applications to enroll the admin user, and register a new user
  called user1 which will be used by the other applications to interact with the deployed
  FabCar contract:
    node enrollAdmin
    node registerUser

  You can run the invoke application as follows. By default, the invoke application will
  create a new car, but you can update the application to submit other transactions:
    node invoke

  You can run the query application as follows. By default, the query application will
  return all cars, but you can update the application to evaluate other transactions:
    node query

TypeScript:

  Start by changing into the "typescript" directory:
    cd typescript

  Next, install all required packages:
    npm install

  Next, compile the TypeScript code into JavaScript:
    npm run build

  Then run the following applications to enroll the admin user, and register a new user
  called user1 which will be used by the other applications to interact with the deployed
  FabCar contract:
    node dist/enrollAdmin
    node dist/registerUser

  You can run the invoke application as follows. By default, the invoke application will
  create a new car, but you can update the application to submit other transactions:
    node dist/invoke

  You can run the query application as follows. By default, the query application will
  return all cars, but you can update the application to evaluate other transactions:
    node dist/query

Java:

  Start by changing into the "java" directory:
    cd java

  Then, install dependencies and run the test using:
    mvn test

  The test will invoke the sample client app which perform the following:
    - Enroll admin and user1 and import them into the wallet (if they don't already exist there)
    - Submit a transaction to create a new car
    - Evaluate a transaction (query) to return details of this car
    - Submit a transaction to change the owner of this car
    - Evaluate a transaction (query) to return the updated details of this car

EOF
