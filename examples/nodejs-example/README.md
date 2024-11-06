# Fluree Client Node.js Example

This example demonstrates how to use the Fluree client in a Node.js environment.

## Prerequisites

- Node.js installed (v14 or higher)
- A running Fluree instance (default: localhost:8090)

## Setup

1. Install dependencies:

```bash
npm install
```

This will install the local version of @fluree/fluree-client from the parent directory.

## Running the Example

```bash
npm start
```

This will run the example script which:

1. Creates a connection to Fluree
2. Performs a transaction
3. Executes a basic query
4. Retrieves history information

## Code Structure

- `package.json` - Project configuration and dependencies
- `index.js` - Main example code demonstrating Fluree client usage

## Expected Output

The script will output the results of each operation to the console:

- Query results showing existing data
- Transaction results after adding a new person
- History information about recent changes
