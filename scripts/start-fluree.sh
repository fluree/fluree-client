#!/bin/bash

CONFIG_FILE="__tests__/config/fluree-images.json"

# Function to get value from JSON config
get_config_value() {
    local key=$1
    if command -v jq >/dev/null 2>&1; then
        echo $(cat $CONFIG_FILE | jq -r ".$key")
    else
        # Fallback if jq is not installed
        if [ "$key" = "defaultImage" ]; then
            echo "5839ffe273062b8da972b120deb54dd62e7c3d1f"
        elif [ "$key" = "containerPort" ]; then
            echo "8090"
        elif [ "$key" = "hostPort" ]; then
            echo "8095"
        fi
    fi
}

# Get image tag from environment variable or config
if [ -n "$FLUREE_TEST_IMAGE" ]; then
    IMAGE_TAG="$FLUREE_TEST_IMAGE"
else
    IMAGE_TAG=$(get_config_value "defaultImage")
fi

# Get port configuration
CONTAINER_PORT=$(get_config_value "containerPort")
HOST_PORT=$(get_config_value "hostPort")

# Remove existing container
docker rm -f test-db

# Start new container
echo "Starting Fluree test container with image: fluree/server:${IMAGE_TAG}"
docker run -d --name test-db -p "${HOST_PORT}:${CONTAINER_PORT}" "fluree/server:${IMAGE_TAG}"

echo "Waiting for Fluree test container to start..."
sleep 5
