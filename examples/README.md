# Fluree Client Examples

This directory contains example projects demonstrating how to use @fluree/fluree-client in different environments.

## Available Examples

### [Node.js Example](./nodejs-example)

Demonstrates using the Fluree client in a Node.js environment. Shows how to:

- Connect to a Fluree instance
- Execute queries
- Perform transactions
- Retrieve history information

### [Browser Example](./browser-example)

Demonstrates using the Fluree client directly in a web browser. Shows how to:

- Load the client via script tag
- Create an interactive web interface
- Execute Fluree operations from browser-side JavaScript
- Handle and display results in the DOM

## Prerequisites

For both examples:

- Node.js v14 or higher
- A running Fluree instance (default: localhost:8090)

## Running the Examples

Each example directory contains its own README with specific instructions, but the general process is:

1. Navigate to the example directory:

```bash
cd nodejs-example
# or
cd browser-example
```

2. Install dependencies:

```bash
npm install
```

3. Run the example:

```bash
npm start
```

## Example Structure

Each example is a complete project with:

- Its own package.json
- Local dependency on @fluree/fluree-client
- README with specific instructions
- All necessary source files

This structure allows you to:

1. Run the examples directly
2. Use them as templates for your own projects
3. Experiment with different configurations and usage patterns
