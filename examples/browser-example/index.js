/* eslint-disable jsdoc/require-jsdoc */
import FlureeClient from '@fluree/fluree-client';

async function runQuery() {
  try {
    // Create and connect to a Fluree instance
    const client = await new FlureeClient({
      host: 'localhost',
      port: 8090,
    }).create('browser-example/ledger');

    client.setContext({
      f: 'https://ns.flur.ee/ledger#',
    });

    const txnResult = await client
      .transact({
        insert: {
          '@id': 'andrew',
          name: 'Andrew',
        },
      })
      .send();

    document.getElementById('result').innerHTML = `
            <h3>Txn Result:</h3>
            <pre>${JSON.stringify(txnResult, null, 2)}</pre>
        `;

    // Perform a simple query
    const result = await client
      .query({
        select: { andrew: ['*'] },
      })
      .send();

    // Display the result
    document.getElementById('result').innerHTML += `
            <h3>Query Result:</h3>
            <pre>${JSON.stringify(result, null, 2)}</pre>
        `;

    // Example transaction
    // Example history query
    const historyResult = await client
      .history({
        'commit-details': true,
        t: { at: 'latest' },
      })
      .send();

    // Append history result
    document.getElementById('result').innerHTML += `
            <h3>History Result:</h3>
            <pre>${JSON.stringify(historyResult, null, 2)}</pre>
        `;
  } catch (error) {
    document.getElementById('result').innerHTML = `
            <h3>Error:</h3>
            <pre>${error.message}</pre>
        `;
  }
}

window.runQuery = runQuery;
