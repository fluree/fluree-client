#!/bin/bash

# Check if container exists and is running
if [ "$(docker ps -q -f name=test-db)" ]; then
    echo "Stopping test-db container..."
    docker rm -f test-db
elif [ "$(docker ps -aq -f status=exited -f name=test-db)" ]; then
    echo "Removing stopped test-db container..."
    docker rm test-db
else
    echo "No test-db container found."
fi
