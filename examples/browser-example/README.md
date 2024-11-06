# Fluree Client Browser Example

This example demonstrates how to use the Fluree client in a browser environment.

## Prerequisites

- Node.js installed (v14 or higher) - needed for the development server
- A running Fluree instance (default: localhost:8090)

## Setup

1. Install dependencies:

```bash
npm install
```

This will install:

- The local version of @fluree/fluree-client from the parent directory
- http-server for serving the example

## Running the Example

```bash
npx webpack
npx http-server dist -p 8080
```

This will:

1. Start a local web server
2. Open your default browser to the example page
3. (If not, navigate to http://localhost:8080)

## Using the Example

1. Once the page loads, click the "Run Query" button
2. The example will:
   - Execute a basic transaction and display the results
   - Perform a query and display the results
   - Retrieve and display history information

## Code Structure

- `package.json` - Project configuration and dependencies
- `index.html` - HTML page with basic styling and structure
- `index.js` - JavaScript code demonstrating Fluree client usage
- `webpack.config.js` - Webpack configuration for bundling the example code

## Troubleshooting

If you see CORS errors in the browser console:

1. Ensure your Fluree instance is running
2. Check that Fluree is configured to allow CORS requests from localhost
3. Verify the host and port in the example code match your Fluree configuration
