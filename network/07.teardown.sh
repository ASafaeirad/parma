#!/bin/bash

docker rm -f $(docker ps -aq)
docker volume prune
docker network prune
