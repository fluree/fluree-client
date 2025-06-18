# @fluree/fluree-client

This is the official Fluree client SDK for TypeScript/JavaScript. It is a wrapper around the Fluree API, providing a more convenient way to interact with Fluree v3 databases.

> Tested against the following `fluree/server` Docker Hub images:
>
> - `fluree/server:0d411e4b2c4f1269dc538c65072fd479db9e2e64`: Current stable version / March 12 2025
> - `fluree/server:7ca39f4b5c5c31602b44873cc19d313d33a99382`: January 22 2025
> - `fluree/server:1ffefe432db25a3c8df29f1e01e79ab02abc86cf`: December 5 2024
> - `fluree/server:5839ffe273062b8da972b120deb54dd62e7c3d1f`: November 5 2024
> - `fluree/server:c452631c50b8f8e595d486240dab503bbaad6033`: October 30 2024

## Installation

```bash
npm install @fluree/fluree-client
```

## Usage

### Node.js

```javascript
const { FlureeClient } = require('@fluree/fluree-client');

// Create a new FlureeClient instance
const client = await new FlureeClient({
  host: 'localhost',
  port: 8090,
});

// Perform a query
const result = await client
  .query({
    from: 'my/ledger',
    select: { '?s': ['*'] },
    where: {
      '@id': '?s',
    },
  })
  .send();
```

### ES Modules (Browser)

```javascript
import { FlureeClient } from '@fluree/fluree-client';

// Create a new FlureeClient instance
const client = await new FlureeClient({
  host: 'localhost',
  port: 8090,
});

// Perform a query
const result = await client
  .query({
    from: 'my/ledger',
    select: { '?s': ['*'] },
    where: {
      '@id': '?s',
    },
  })
  .send();
```

### Client Config

The `FlureeClient` constructor takes an optional `config` object with the following properties:

```js
{
    isFlureeHosted, // [boolean] If true, the client will use the Fluree hosted service
    apiKey, // [string] The API key to use for the Fluree hosted service
    ledger, // [string] The ledger/db name on the Fluree instance
    // Do not set "host" and "port" if "isFlureeHosted" is true
    host, // [string] The host where your instance is running (e.g. localhost)
    port, // [number] The port where your instance is running (e.g. 58090)
    create, // [boolean] If true, the ledger will be created if it does not exist
    privateKey, // [string] The private key to use for signing messages
    signMessages, // [boolean] If true, messages will be signed by default
    defaultContext, // [object] The default context to use for queries/txns
}
```

For example:

```js
const client = new FlureeClient({
  ledger: 'fluree-client/client',
  host: 'localhost',
  port: 58090,
  create: true,
  privateKey: 'XXX...XXX',
  signMessages: true,
  defaultContext: {
    schema: 'http://schema.org/',
    name: 'schema:name',
    // ...
  },
});
```

You can also update the configuration of an existing client by using the `configure()` method:

```js
const client = new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
  ledger: 'fluree-jld/387028092978173',
});

client.configure({
  ledger: 'fluree-jld/387028092978174',
});
```

> _*Note*_: As of version 1.2.0, the `FlureeClient` class does not _require_ configuring a value on `ledger`, nor does it require that the `connect()` method be called before generating and sending queries/transactions.
>
> If you wish to call `connect()`, it is an option that simply allows you to validate the existence of a ledger, or to easily create it if using the `create: true` configuration option.

### Methods

- [connect()](#connect)
- [create()](#create)
- [query()](#query)
- [transact()](#transact)
- [delete()](#delete)
- [upsert()](#upsert)
- [history()](#history)
- [generateKeyPair()](#generateKeyPair)
- [setKey()](#setKey)
- [getPrivateKey()](#getPrivateKey)
- [getPublicKey()](#getPublicKey)
- [getDid()](#getDid)
- [setContext()](#setContext)
- [addToContext()](#addToContext)
- [getContext()](#getContext)

#### `connect()`

It is optional but not required to call `connect()` after creating a new `FlureeClient` instance. If used, this will test the connection and (if `config.create === true`) create the ledger if it does not exist.

It will also throw an error if the connection fails (e.g. invalid host, ledger does not exist, etc.)

```js
const connectedClient = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
  ledger: 'fluree-jld/387028092978173',
}).connect();
```

You can optionally provide a `ledger` param to the `connect()` method to override the ledger in the client configuration (or to set it, if it had not previously been provided):

```js
const connectedClient = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
}).connect('fluree-jld/387028092978173');
```

#### `create()`

The `create()` method can be used to create a new ledger on the Fluree instance. This will throw an error if the ledger already exists.

The returned FlureeClient will be configured to use the new ledger.

```js
const client = new FlureeClient({
  host: 'localhost',
  port: 8080,
  ledger: 'fluree-client/client',
});

const createdClient = await client.create('new-ledger');
```

Optionally, you can provide a particular "initial commit" transaction to be used when creating the ledger:

```js
const client = new FlureeClient({
  host: 'localhost',
  port: 8080,
});

const createdClient = await client.create('new-ledger', {
  insert: { '@id': 'freddy', name: 'Freddy' },
});
```

#### `query()`

The `query()` method creates a new `QueryInstance` for querying the Fluree database. The `QueryInstance` can be used & re-used to build, sign, and send queries to the Fluree instance.

> See the [QueryInstance](#QueryInstance) section for more information.

```js
const client = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
});

const queryInstance = client.query({
  from: 'test/query',
  select: { freddy: ['*'] },
});

const response = await queryInstance.send();
```

#### `transact()`

The `transact()` method creates a new `TransactionInstance` for transacting with the Fluree database. The `TransactionInstance` can be used & re-used to build, sign, and send transactions to the Fluree instance.

> See the [TransactionInstance](#TransactionInstance) section for more information.

```js
const client = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
});

const transactionInstance = client.transact({
  ledger: 'test/transaction',
  insert: { '@id': 'freddy', name: 'Freddy' },
});

const response = await transactionInstance.send();
```

#### `delete()`

The `delete()` method creates a new `TransactionInstance` for deleting subjects by `@id` in the Fluree database. The `TransactionInstance` can then be used to sign and send delete transactions to the Fluree instance.

If your `flureeClient` instance does not have a `ledger` configured, or, if you would like to specify a different ledger for the delete transaction, you can provide a `ledger` parameter to the `delete()` method.

> Delete is not an API endpoint in Fluree. This method helps to transform a single or list of subject identifiers (@id) into a _where/delete_ transaction that deletes the subject(s) and all facts about the subject(s).

```js
// Existing data:
// [
//   { "@id": "freddy", "name": "Freddy" },
//   { "@id": "alice", "name": "Alice" }
// ]

const txnInstance = client.delete(['freddy']);

const txnObject = txnInstance.getTransaction();

console.log(txnObject);

//  {
//     where: [{ '@id': 'freddy', ?p0: '?o0' }],
//     delete: [{ '@id': 'freddy', ?p0: '?o0' }],
//     ledger: ...
//   }

const response = await txnInstance.send();

// New data state after txn:
// [
//   { "@id": "alice", "name": "Alice" }
// ]
```

#### `upsert()`

The `upsert()` method creates a new `TransactionInstance` for upserting with the Fluree database. The `TransactionInstance` can be used & re-used to build, sign, and send upsert transactions to the Fluree instance.

If your `flureeClient` instance does not have a `ledger` configured, or, if you would like to specify a different ledger for the upsert transaction, you can provide a `ledger` parameter to the `upsert()` method.

> Upsert is not an API endpoint in Fluree. This method helps to transform an _upsert_ transaction into an _insert/where/delete_ transaction.
>
> Upsert assumes that the facts provided in the transaction should be treated as the true & accurate state of the data after the transaction is processed.
>
> This means that facts in your transaction should be inserted (if new) and should replace existing facts (if they exist on those subjects & properties).

```js
// Existing data:
// [
//   { "@id": "freddy", "name": "Freddy" },
//   { "@id": "alice", "name": "Alice" }
// ]

const txnInstance = client.upsert([
  { '@id': 'freddy', name: 'Freddy the Yeti' },
  { '@id': 'alice', age: 25 },
]);

const txnObject = txnInstance.getTransaction();

console.log(txnObject);

//  {
//     where: [ { '@id': 'freddy', name: '?1' }, { '@id': 'alice', age: '?2' } ],
//     delete: [ { '@id': 'freddy', name: '?1' }, { '@id': 'alice', age: '?2' } ],
//     insert: [
//       { '@id': 'freddy', name: 'Freddy the Yeti' },
//       { '@id': 'alice', age: 25 }
//     ],
//     ledger: ...
//   }

const response = await txnInstance.send();

// New data state after txn:
// [
//   { "@id": "freddy", "name": "Freddy the Yeti" },
//   { "@id": "alice", "name": "Alice", "age": 25 }
// ]

// Note that if this had been an "insert" freddy would now have two names.
// Note also that if this had been handled by deleting/insert, alice might have lost her name.
```

#### `history()`

The `history()` method creates a new `HistoryQueryInstance` for querying the history of the Fluree database. The `HistoryQueryInstance` can be used & re-used to build, sign, and send history queries to the Fluree instance.

> See the [HistoryQueryInstance](#HistoryQueryInstance) section for more information.

```js
const client = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
});

const historyQuery = client.history({
  from: 'test/history',
  'commit-details': true,
  t: { at: 'latest' },
});

const response = await historyQuery.send();
```

#### `generateKeyPair()`

Automatically generates a new key pair and adds it to the FlureeClient instance. The public key and DID will be derived from the private key and added to the FlureeClient instance.

```js
const client = new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
});

client.generateKeyPair();

const privateKey = client.getPrivateKey();
```

#### `setKey()`

This adds a private key to the FlureeClient instance. This key will be used to sign messages by default when using the sign() method on a query or transaction.

The public key and DID will be derived from the private key and added to the FlureeClient instance.

```js
const client = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
}).connect();

const privateKey = 'XXX...XXX';

client.setKey(privateKey);

const publicKey = client.getPublicKey();
const did = client.getDid();
```

#### `getPrivateKey()`

The `getPrivateKey()` method returns the private key of the FlureeClient instance (if one has been set).

> NOTE: Be careful with this method. It is not recommended to log or expose private keys.

```js
const client = new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
});

client.generateKeyPair();

const privateKey = client.getPrivateKey();
```

#### `getPublicKey()`

The `getPublicKey()` method returns the public key of the FlureeClient instance (if one has been set).

```js
const client = new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
});

client.generateKeyPair();

const publicKey = client.getPublicKey();
```

#### `getDid()`

The `getDid()` method returns the DID of the FlureeClient instance (if one has been set).

```js
const client = new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
});

client.generateKeyPair();

const did = client.getDid();
```

#### `setContext()`

The `setContext()` method sets the default context for the FlureeClient instance. This context will be used for all queries and transactions by default.

Unlike `addToContext()`, which merges new context elements into any existing context for the client, this method will replace the existing default context entirely.

```js
const client = new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
  defaultContext: { schema: 'http://schema.org/' },
});

client.setContext({ ex: 'http://example.org/' });

// client.getContext() === { "ex": "http://example.org/" }
```

#### `addToContext()`

The `addToContext()` method adds to the default context for the FlureeClient instance. This context will be used for all queries and transactions by default.

If a default context already exists, the new context will be merged with the existing context.

```js
const client = new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
  defaultContext: { schema: 'http://schema.org/' },
});

client.addToContext({ ex: 'http://example.org/' });

// client.getContext() === {
//  "schema": "http://schema.org/",
//  "ex": "http://example.org/"
// }
```

#### `getContext()`

The `getContext()` method returns the default context for the FlureeClient instance (if one has been set).

```js
const client = new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
  defaultContext: { schema: 'http://schema.org/' },
});

const context = client.getContext();

// context === { "schema": "http://schema.org/" }
```

### QueryInstance

The `QueryInstance` class is used to build, sign, and send queries to the Fluree instance.

```js
const client = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
}).connect();

const queryInstance = client.query({
  from: 'test/query',
  select: { freddy: ['*'] },
});

const signedQueryInstance = queryInstance.sign('XXX...XXX');

const response = await signedQueryInstance.send();
```

Additional Methods:

- [send()](#send)
- [sign()](#sign)
- [getQuery()](#getQuery)
- [getSignedQuery()](#getSignedQuery)

#### `send()`

The `send()` method sends the query to the Fluree instance and returns the response.

```js
const client = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
});

const queryInstance = client.query({
  from: 'test/query',
  select: { freddy: ['*'] },
});

const response = await queryInstance.send();
```

#### `sign()`

The `sign()` method signs the query with the private key of the FlureeClient instance. If no private key has been set, or if no privateKey parameter is passed to `sign()`, it will throw an error.

```js
const client = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
});

let signedQueryInstance = client
  .query({
    from: 'test/query',
    select: { freddy: ['*'] },
  })
  .sign('XXX...XXX');

// or

client.generateKeyPair();

signedQueryInstance = client
  .query({
    from: 'test/query',
    select: { freddy: ['*'] },
  })
  .sign();

const response = await signedQueryInstance.send();
```

#### `getQuery()`

The `getQuery()` method returns the query object of the QueryInstance.

```js
const client = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
  defaultContext: { ex: 'http://example.org/' },
});

const queryInstance = client.query({
  from: 'test/query',
  select: { 'ex:freddy': ['*'] },
});

const query = queryInstance.getQuery();

console.log(query);
// {
//   "@context": { "ex": "http://example.org/" },
//   from: 'test/query',
//   select: { "ex:freddy": ['*'] }
// }
```

#### `getSignedQuery()`

The `getSignedQuery()` method returns the signed query of the QueryInstance in the form of a JWS string.

```js
const client = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
});

client.generateKeyPair();

const queryInstance = client.query({
  from: 'fluree-client/client',
  select: { freddy: ['*'] },
});

const signedQueryInstance = queryInstance.sign();

const signedQuery = signedQueryInstance.getSignedQuery();

console.log(signedQuery);
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWxlY3QiOnsiZnJlZGR5IjpbIioiXX0sImZyb20iOiJmbHVyZWUtY2xpZW50L2NsaWVudCJ9.QNTXpZCQXsbO9zoOtMHT4yH-OqAaNq8ezhV5k7C_BuI
```

### TransactionInstance

The `TransactionInstance` class is used to build, sign, and send transactions to the Fluree instance.

```js
const client = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
});

const transaction = client.transact({
  ledger: 'fluree-client/client',
  insert: { '@id': 'freddy', name: 'Freddy' },
});

const signedTransaction = transaction.sign('XXX...XXX');

const response = await signedTransaction.send();
```

Additional Methods:

- [send()](#send-1)
- [sign()](#sign-1)
- [getTransaction()](#getTransaction)
- [getSignedTransaction()](#getSignedTransaction)

#### `send()`

The `send()` method sends the transaction to the Fluree instance and returns the response.

```js
const client = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
});

const transaction = client.transact({
  ledger: 'fluree-client/client',
  insert: { '@id': 'freddy', name: 'Freddy' },
});

const response = await transaction.send();
```

#### `sign()`

The `sign()` method signs the transaction with the private key of the FlureeClient instance. If no private key has been set, or if no privateKey parameter is passed to `sign()`, it will throw an error.

```js
const client = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
});

let signedTransaction = client
  .transact({
    ledger: 'fluree-client/client',
    insert: { '@id': 'freddy', name: 'Freddy' },
  })
  .sign('XXX...XXX');

// or

client.generateKeyPair();

signedTransaction = client
  .transact({
    ledger: 'fluree-client/client',
    insert: { '@id': 'freddy', name: 'Freddy' },
  })
  .sign();

const response = await signedTransaction.send();
```

#### `getTransaction()`

The `getTransaction()` method returns the transaction object of the TransactionInstance.

```js
const client = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
});

const transaction = client.transact({
  ledger: 'fluree-client/client',
  insert: { '@id': 'freddy', name: 'Freddy' },
});

const txn = transaction.getTransaction();

console.log(txn);
// {
//   ledger: 'fluree-client/client',
//   insert: { '@id': 'freddy', name: 'Freddy' }
// }
```

#### `getSignedTransaction()`

The `getSignedTransaction()` method returns the signed transaction of the TransactionInstance in the form of a JWS string.

```js
const client = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
});

client.generateKeyPair();

const transaction = client.transact({
  ledger: 'fluree-client/client',
  insert: { '@id': 'freddy', name: 'Freddy' },
});

const signedTransaction = transaction.sign();

const signedTxn = signedTransaction.getSignedTransaction();

console.log(signedTxn);
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpbnNlcnQiOnsiQGlkIjoiZnJlZGR5IiwibmFtZSI6IkZyZWRkeSJ9LCJsZWRnZXIiOiJmbHVyZWUtY2xpZW50L2NsaWVudCJ9.SNHjlNricJbATF06mbrvnqunfV7l2gZHyvj7zYFTby0
```

### HistoryQueryInstance

The `HistoryQueryInstance` class is used to build, sign, and send history queries to the Fluree instance.

```js
const client = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
});

const historyQuery = client.history({
  from: 'test/history',
  'commit-details': true,
  t: { at: 'latest' },
});

const response = await historyQuery.send();
```

#### `send()`

The `send()` method sends the history query to the Fluree instance and returns the response.

```js
const client = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
});

const historyQuery = client.history({
  from: 'test/history',
  'commit-details': true,
  t: { at: 'latest' },
});

const response = await historyQuery.send();
```

## Running tests

Before running tests, you'll need a `.env.local` file in the root of the project.
This file needs to contain the following:

```
TEST_NEXUS_LEDGER="fluree-jld/387028092978318"
TEST_API_KEY="_DPu2OWxmJ-zRwnzNr8uL...5mfV1OsfOXcRmb35t02rp1gMxxSw"
```

### Run tests

In the root of the project, run:

```
yarn test
```

## Examples

The repository includes complete example projects demonstrating usage in both Node.js and browser environments.

### Running the Node.js Example

```bash
# Navigate to the Node.js example directory
cd examples/nodejs-example

# Install dependencies (including local fluree-client)
npm install

# Run the example
npm start
```

### Running the Browser Example

```bash
# Navigate to the browser example directory
cd examples/browser-example

# Install dependencies (including local fluree-client)
npm install

# Start the development server
npm start
```

This will open your default browser to the example page. Click the "Run Query" button to execute the example operations.

## Contributing & Deployment

### Preparing for NPM Deployment

Before deploying a new version to npm, contributing developers should follow these steps:

#### 1. Pre-deployment Checklist

Ensure all changes are properly tested and ready:

```bash
# Run the full test suite (includes Node.js and browser tests)
yarn test

# Run linting to ensure code quality
yarn lint

# Build the project to verify compilation
yarn build
```

#### 2. Version Management

Update the package version following semantic versioning:

```bash
# For patch releases (bug fixes)
yarn version --patch

# For minor releases (new features, backward compatible)
yarn version --minor

# For major releases (breaking changes)
yarn version --major
```

This will automatically:
- Update `package.json` version
- Create a git tag
- Run the `prepare` script (builds the project)

#### 3. Publishing to NPM

The project uses npm hooks to ensure quality before publishing:

```bash
# This will automatically run:
# 1. yarn test (full test suite)
# 2. yarn lint (code quality check)
# 3. Publish to npm if all checks pass
yarn publish
```

#### 4. Important Notes

- **Automated Testing**: The `prepublishOnly` script ensures tests and linting pass before any npm publish
- **Build Process**: The `prepare` script runs automatically during `yarn install` and before publishing
- **Browser Support**: Tests include both Node.js and browser environments via Karma
- **Docker Integration**: Tests use testcontainers to ensure consistent Fluree server environment

#### 5. Troubleshooting Deployment Issues

If deployment fails:

1. **Test Failures**: Run `yarn test` locally to identify and fix failing tests
2. **Lint Errors**: Run `yarn lint` to see and fix code quality issues
3. **Build Issues**: Run `yarn build` to check for TypeScript compilation errors
4. **Docker Issues**: Ensure Docker is running for integration tests

The build creates multiple output formats:
- `dist/nodejs/` - Node.js CommonJS and ES modules
- `dist/browser/` - Minified browser bundle

All outputs include TypeScript declaration files for proper IDE support.
