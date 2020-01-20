#!/bin/sh

echo "Generate crypto artifacts."

# Generate artifacts
cryptogen generate --config=./crypto-config.yaml
