#!/bin/sh

docker-compose \
  -f docker-compose-cli.yaml \
  -f docker-compose-ca.yaml \
  -f docker-compose-couch.yaml \
  down -d
