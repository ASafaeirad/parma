#!/bin/sh

echo "Stop Orgs, CLI, CI and Couch db."

docker-compose \
  -f docker-compose-cli.yaml \
  -f docker-compose-ca.yaml \
  -f docker-compose-couch.yaml \
  down -d
