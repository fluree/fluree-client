import FlureeClient from '@fluree/fluree-client';

/**
 * Demonstrates various Fluree operations in a Node.js environment
 * including queries, transactions, and history queries.
 * @async
 * @returns Nothing - runs examples and logs results to console
 */
async function main() {
  try {
    // Create and connect to a Fluree instance
    const client = await new FlureeClient({
      host: 'localhost',
      port: 8090,
      ledger: 'node-example/ledger',
      create: true, // You'll want to remove this if you've already created
    }).connect();

    client.setContext({
      f: 'https://ns.flur.ee/ledger#',
    });

    // Example 1: Simple transaction
    console.log('\nExecuting transaction...');
    const transactionResult = await client
      .transact({
        insert: {
          '@id': 'jack',
          name: 'Jack',
        },
      })
      .send();
    console.log(
      'Transaction Result:',
      JSON.stringify(transactionResult, null, 2),
    );

    // Example 2: Simple query
    console.log('\nExecuting simple query...');
    const queryResult = await client
      .query({
        select: { jack: ['*'] },
      })
      .send();
    console.log('Query Result:', JSON.stringify(queryResult, null, 2));

    // Example 3: History Query
    console.log('\nExecuting history query...');
    const historyResult = await client
      .history({
        'commit-details': true,
        t: { at: 'latest' },
      })
      .send();
    console.log('History Result:', JSON.stringify(historyResult, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the examples
main();