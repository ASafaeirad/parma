#!/bin/bash
CHANNEL_NAME=${1:-"mychannel"}
DELAY=${2:-3}
TIMEOUT=${3-10}
VERBOSE=${4:-"false"}
NO_CHAINCODE=${5:-"false"}

LANGUAGE=node
ORDERER=orderer.example.com:7050

CC_NAME=mycc
CC_SRC_PATH="/opt/gopath/src/github.com/chaincode/src/"
CRYPTO_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto"

ORDERER_CA="$CRYPTO_PATH/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
PEER0_ORG1_CA="$CRYPTO_PATH/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
PEER0_ORG2_CA="$CRYPTO_PATH/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"
PEER0_ORG3_CA="$CRYPTO_PATH/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt"

exitIfFailed() {
  if [ $1 -ne 0 ]; then
    echo "!!!!!!!!!!!!!!! $2 !!!!!!!!!!!!!!!!"
    echo "========= ERROR !!! FAILED to execute End-2-End Scenario ==========="
    echo
    exit 1
  fi
}

MAX_RETRY=10
DELAY=5

joinChannelWithRetry() {
  PEER=$1
  ORG=$2
  TRY=${3:-0}

  setOrgAndPeer $ORG $PEER

  set -x
  peer channel join -b "$CHANNEL_NAME.block" >&log.txt
  res=$?
  set +x
  cat log.txt

  if [ $res -ne 0 ] && [ $TRY -lt $MAX_RETRY ]; then
    echo "peer${PEER}.org${ORG} failed to join the channel, Retry after $DELAY seconds"
    sleep "$DELAY"
    TRY=$((TRY + 1))
    joinChannelWithRetry $PEER $ORG $TRY
  fi

  exitIfFailed $res "After $MAX_RETRY attempts, peer${PEER}.org${ORG} has failed to join channel '$CHANNEL_NAME' "
}

setOrgAndPeer() {
  PEER=$1
  ORG=$2

  if [ $ORG -eq 1 ]; then
    CORE_PEER_LOCALMSPID="Org1MSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG1_CA
    CORE_PEER_MSPCONFIGPATH="$CRYPTO_PATH/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
    if [ $PEER -eq 0 ]; then
      CORE_PEER_ADDRESS=peer0.org1.example.com:7051
    else
      CORE_PEER_ADDRESS=peer1.org1.example.com:8051
    fi
  elif [ $ORG -eq 2 ]; then
    CORE_PEER_LOCALMSPID="Org2MSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG2_CA
    CORE_PEER_MSPCONFIGPATH="$CRYPTO_PATH/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp"
    if [ $PEER -eq 0 ]; then
      CORE_PEER_ADDRESS=peer0.org2.example.com:9051
    else
      CORE_PEER_ADDRESS=peer1.org2.example.com:10051
    fi
  elif [ $ORG -eq 3 ]; then
    CORE_PEER_LOCALMSPID="Org3MSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG3_CA
    CORE_PEER_MSPCONFIGPATH="$CRYPTO_PATH/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp"
    if [ $PEER -eq 0 ]; then
      CORE_PEER_ADDRESS=peer0.org3.example.com:11051
    else
      CORE_PEER_ADDRESS=peer1.org3.example.com:12051
    fi
  else
    echo "================== ERROR !!! ORG Unknown =================="
  fi

  if [ "$VERBOSE" == "true" ]; then
    env | grep CORE
  fi
}

createChannel() {
  $PEER $1
  $ORG $2
  setOrgAndPeer $PEER $ORG

  if [ -z "$CORE_PEER_TLS_ENABLED" ] || [ "$CORE_PEER_TLS_ENABLED" = "false" ]; then
    set -x
    peer channel create -o $ORDERER -c "$CHANNEL_NAME" -f ./channel-artifacts/channel.tx >&log.txt
    res=$?
    set +x
  else
    set -x
    peer channel create -o $ORDERER -c "$CHANNEL_NAME" -f ./channel-artifacts/channel.tx --tls "$CORE_PEER_TLS_ENABLED" --cafile "$ORDERER_CA" >&log.txt
    res=$?
    set +x
  fi
  cat log.txt
  exitIfFailed $res "Channel creation failed"
  echo "===================== Channel '$CHANNEL_NAME' created ===================== "
  echo
}

joinChannel() {
  for org in 1 2; do
    for peer in 0 1; do
      joinChannelWithRetry $peer $org
      echo "===================== peer${peer}.org${org} joined channel '$CHANNEL_NAME' ===================== "
      sleep $DELAY
      echo
    done
  done
}

updateAnchorPeers() {
  PEER=$1
  ORG=$2
  setOrgAndPeer $PEER $ORG

  if [ -z "$CORE_PEER_TLS_ENABLED" ] || [ "$CORE_PEER_TLS_ENABLED" = "false" ]; then
    set -x
    peer channel update -o $ORDERER -c $CHANNEL_NAME -f ./channel-artifacts/${CORE_PEER_LOCALMSPID}anchors.tx >&log.txt
    res=$?
    set +x
  else
    set -x
    peer channel update -o $ORDERER -c $CHANNEL_NAME -f ./channel-artifacts/${CORE_PEER_LOCALMSPID}anchors.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA >&log.txt
    res=$?
    set +x
  fi
  cat log.txt

  exitIfFailed $res "Anchor peer update failed"
  echo "===================== Anchor peers updated for org '$CORE_PEER_LOCALMSPID' on channel '$CHANNEL_NAME' ===================== "
  sleep $DELAY
  echo
}

installChaincode() {
  PEER=$1
  ORG=$2
  setOrgAndPeer $PEER $ORG
  VERSION=${3:-1.0}

  set -x
  peer chaincode install -n ${CC_NAME} -v ${VERSION} -l ${LANGUAGE} -p ${CC_SRC_PATH} >&log.txt
  res=$?
  set +x
  cat log.txt

  verifyResult $res "Chaincode installation on peer${PEER}.org${ORG} has failed"
  echo "===================== Chaincode is installed on peer${PEER}.org${ORG} ===================== "
  echo
}

instantiateChaincode() {
  PEER=$1
  ORG=$2
  setOrgAndPeer $PEER $ORG
  VERSION=${3:-1.0}

  # while 'peer chaincode' command can get the orderer endpoint from the peer
  # (if join was successful), let's supply it directly as we know it using
  # the "-o" option
  if [ -z "$CORE_PEER_TLS_ENABLED" ] || [ "$CORE_PEER_TLS_ENABLED" = "false" ]; then
    set -x
    peer chaincode instantiate -o $ORDERER -C $CHANNEL_NAME -n $CC_NAME -l ${LANGUAGE} -v ${VERSION} -c '{"Args":["init","a","100","b","200"]}' -P "AND ('Org1MSP.peer','Org2MSP.peer')" >&log.txt
    res=$?
    set +x
  else
    set -x
    peer chaincode instantiate -o $ORDERER --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -C $CHANNEL_NAME -n $CC_NAME -l ${LANGUAGE} -v 1.0 -c '{"Args":["init","a","100","b","200"]}' -P "AND ('Org1MSP.peer','Org2MSP.peer')" >&log.txt
    res=$?
    set +x
  fi
  cat log.txt
  verifyResult $res "Chaincode instantiation on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME' failed"
  echo "===================== Chaincode is instantiated on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME' ===================== "
  echo
}

main() {
  echo "Creating channel..."
  createChannel 0 1

  echo "Having all peers join the channel..."
  joinChannel

  echo "Updating anchor peers for org1..."
  updateAnchorPeers 0 1
  echo "Updating anchor peers for org2..."
  updateAnchorPeers 0 2

  if [ "${NO_CHAINCODE}" != "true" ]; then
    echo "Installing chaincode on peer0.org1..."
    installChaincode 0 1
    echo "Install chaincode on peer0.org2..."
    installChaincode 0 2
  fi

  echo
  echo "========= All GOOD, execution completed =========== "
  echo

  exit 0
}

main
