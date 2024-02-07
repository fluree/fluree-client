# Fluree Client SDK for TypeScript/JavaScript

This is the official Fluree client SDK for TypeScript/JavaScript. It is a wrapper around the Fluree API, providing a more convenient way to interact with Fluree v3 databases.

## Installation

```bash
npm install @fluree/fluree-client
```

## Usage

To use the Fluree client SDK, you need to import the `FlureeClient` class from the package and create a new instance of it. You can then use the instance to interact with a Fluree database.

```js
import { FlureeClient } from '@fluree/fluree-client';

const client = new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
  ledger: 'fluree-jld/387028092978173',
}).connect();

await client
  .query({
    select: { freddy: ['*'] },
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

const privateKey = client.generateKeyPair();

client.configure({
  privateKey,
  signMessages: true,
});
```

### Methods

- [connect()](#connect)
- [create()](#create)
- [query()](#query)
- [transact()](#transact)
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

In order to use the FlureeClient instance, you must first connect to the Fluree instance. This will test the connection and (if `config.create === true`) create the ledger if it does not exist.

It will also throw an error if the connection fails (e.g. invalid host, ledger does not exist, etc.)

```js
const connectedClient = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
  ledger: 'fluree-jld/387028092978173',
}).connect();
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

#### `query()`

The `query()` method creates a new `QueryInstance` for querying the Fluree database. The `QueryInstance` can be used & re-used to build, sign, and send queries to the Fluree instance.

> See the [QueryInstance](#QueryInstance) section for more information.

```js
const client = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
  ledger: 'fluree-jld/387028092978173',
}).connect();

const queryInstance = client.query({
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
  ledger: 'fluree-jld/387028092978173',
}).connect();

const transactionInstance = client.transact({
  insert: { '@id': 'freddy', name: 'Freddy' },
});

const response = await transactionInstance.send();
```

#### `history()`

The `history()` method creates a new `HistoryQueryInstance` for querying the history of the Fluree database. The `HistoryQueryInstance` can be used & re-used to build, sign, and send history queries to the Fluree instance.

> See the [HistoryQueryInstance](#HistoryQueryInstance) section for more information.

```js
const client = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
  ledger: 'fluree-jld/387028092978173',
}).connect();

const historyQuery = client.history({
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
  ledger: 'fluree-jld/387028092978173',
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
  ledger: 'fluree-jld/387028092978173',
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
  ledger: 'fluree-jld/387028092978173',
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
  ledger: 'fluree-jld/387028092978173',
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
  ledger: 'fluree-jld/387028092978173',
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
  ledger: 'fluree-jld/387028092978173',
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
  ledger: 'fluree-jld/387028092978173',
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
  ledger: 'fluree-jld/387028092978173',
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
  ledger: 'fluree-jld/387028092978173',
}).connect();

const queryInstance = client.query({
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
  ledger: 'fluree-jld/387028092978173',
}).connect();

const queryInstance = client.query({
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
  ledger: 'fluree-jld/387028092978173',
}).connect();

let signedQueryInstance = client
  .query({
    select: { freddy: ['*'] },
  })
  .sign('XXX...XXX');

// or

client.generateKeyPair();

signedQueryInstance = client
  .query({
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
  ledger: 'fluree-jld/387028092978173',
  defaultContext: { ex: 'http://example.org/' },
}).connect();

const queryInstance = client.query({
  select: { 'ex:freddy': ['*'] },
});

const query = queryInstance.getQuery();

console.log(query);
// {
//   "@context": { "ex": "http://example.org/" },
//   from: 'fluree-client/client',
//   select: { "ex:freddy": ['*'] }
// }
```

#### `getSignedQuery()`

The `getSignedQuery()` method returns the signed query of the QueryInstance in the form of a JWS string.

```js
const client = await new FlureeClient({
  isFlureeHosted: true,
  apiKey: process.env.FLUREE_API_KEY,
  ledger: 'fluree-jld/387028092978173',
}).connect();

client.generateKeyPair();

const queryInstance = client.query({
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
  ledger: 'fluree-jld/387028092978173',
}).connect();

const transaction = client.transact({
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
  ledger: 'fluree-jld/387028092978173',
}).connect();

const transaction = client.transact({
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
  ledger: 'fluree-jld/387028092978173',
}).connect();

let signedTransaction = client
  .transact({
    insert: { '@id': 'freddy', name: 'Freddy' },
  })
  .sign('XXX...XXX');

// or

client.generateKeyPair();

signedTransaction = client
  .transact({
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
  ledger: 'fluree-jld/387028092978173',
}).connect();

const transaction = client.transact({
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
  ledger: 'fluree-jld/387028092978173',
}).connect();

client.generateKeyPair();

const transaction = client.transact({
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
  ledger: 'fluree-jld/387028092978173',
}).connect();

const historyQuery = client.history({
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
  ledger: 'fluree-jld/387028092978173',
}).connect();

const historyQuery = client.history({
  'commit-details': true,
  t: { at: 'latest' },
});

const response = await historyQuery.send();
```
