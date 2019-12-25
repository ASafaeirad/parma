#!/bin/sh

docker-compose -f ./docker-compose-cli.yaml down
docker-compose -f ./docker-compose-ca.yaml down
