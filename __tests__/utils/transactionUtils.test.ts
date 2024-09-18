import { InsertStatement } from '../../src/types/TransactionTypes';
import {
  convertTxnToWhereDelete,
  flattenTxn,
} from '../../src/utils/transactionUtils';

describe('transactionUtils', () => {
  describe('flattenTxn', () => {
    it('can flatten a simple transaction', () => {
      const txn = [
        {
          '@id': 'ex:freddy',
          name: 'Freddy the Yeti',
          favoriteNumbers: [4, 5],
          friends: [
            {
              '@id': 'ex:andrew',
              name: 'Andrew',
              friends: [{ '@id': 'ex:freddy' }],
            },
            { '@id': 'ex:alice' },
            { '@id': 'ex:letty', name: 'Letty' },
            { '@id': 'ex:bob' },
            { name: 'blank guy' },
          ],
        },
        {
          '@id': 'ex:alice',
          superHeroPower: 'mind reading',
          friends: { '@id': 'ex:freddy' },
        },
      ] as InsertStatement;

      const result = flattenTxn(txn, '@id');

      expect(result['ex:freddy']).toBeDefined();
      expect(result['ex:andrew']).toBeDefined();
      expect(result['ex:alice']).toBeDefined();
      expect(result['ex:bob']).toBeUndefined();
    });

    it('can produce a valid where statement from a flattenedMap', () => {
      const flattenedMap = {
        'ex:freddy': {
          '@id': 'ex:freddy',
          name: 'Freddy the Yeti',
          favoriteNumbers: [4, 5],
          friends: [
            {
              '@id': 'ex:andrew',
            },
            {
              '@id': 'ex:alice',
            },
            {
              '@id': 'ex:letty',
            },
            {
              '@id': 'ex:bob',
            },
          ],
        },
        'ex:andrew': {
          '@id': 'ex:andrew',
          name: 'Andrew',
          friends: [
            {
              '@id': 'ex:freddy',
            },
          ],
        },
        'ex:alice': {
          '@id': 'ex:alice',
          superHeroPower: 'mind reading',
          friends: {
            '@id': 'ex:freddy',
          },
        },
        'ex:letty': {
          '@id': 'ex:letty',
          name: 'Letty',
        },
      };

      const [whereResult] = convertTxnToWhereDelete(flattenedMap, '@id');

      const expectedWhereResult = [
        ['optional', { '@id': 'ex:freddy', name: '?1' }],
        ['optional', { '@id': 'ex:freddy', favoriteNumbers: '?2' }],
        ['optional', { '@id': 'ex:freddy', friends: '?3' }],
        ['optional', { '@id': 'ex:andrew', name: '?4' }],
        ['optional', { '@id': 'ex:andrew', friends: '?5' }],
        ['optional', { '@id': 'ex:alice', superHeroPower: '?6' }],
        ['optional', { '@id': 'ex:alice', friends: '?7' }],
        ['optional', { '@id': 'ex:letty', name: '?8' }],
      ];

      expect(whereResult).toEqual(expectedWhereResult);
    });
  });
});
