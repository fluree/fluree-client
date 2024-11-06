#!/bin/bash

# Initialize success and failure counters
success=0
failure=0

for i in {1..50}; do
  echo "Running test $i"
  
  # Capture the output of your command
  output=$(yarn test ./__tests__/core/FlureeClient.test.ts -t 'FlureeClient signing messages can successfully' 2>&1)
  
  # Check if the output matches "✓ can successfully transact"
  if echo "$output" | grep -q "✓ can successfully transact"; then
    ((success++))
  else
    ((failure++))
  fi

  # Echo the current success and failure counts
  echo "Success: $success, Failure: $failure"

  # Wait for 2 seconds
  sleep 2
done
