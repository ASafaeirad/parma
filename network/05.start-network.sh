#!/bin/sh

docker-compose -f docker-compose-cli.yaml up -d
docker-compose -f docker-compose-ca.yaml up -d
