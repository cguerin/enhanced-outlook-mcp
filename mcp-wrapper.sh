#!/bin/bash

# Change to the script's directory
cd "$(dirname "$0")"

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Start the MCP server
exec node index.js