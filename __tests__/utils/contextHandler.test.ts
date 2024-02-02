import { mergeContexts } from '../../src/utils/contextHandler';

describe('contextHandler', () => {
  it('can merge complex contexts', () => {
    const context1 = [
      'https://ns.flur.ee/',
      {
        ex: 'https://example.com/',
        context: '@context',
        friendOf: { '@reverse': 'ex:friend' },
      },
    ];
    const context2 = {
      ex: 'https://example.com/',
      context: '@context',
      friendOf: { '@reverse': 'ex:friend' },
    };
    const result = mergeContexts(context1, context2);
    expect(result).toEqual([
      'https://ns.flur.ee/',
      {
        ex: 'https://example.com/',
        context: '@context',
        friendOf: { '@reverse': 'ex:friend' },
      },
      {
        ex: 'https://example.com/',
        context: '@context',
        friendOf: { '@reverse': 'ex:friend' },
      },
    ]);
  });
  it('can merge string contexts', () => {
    const context1 = 'https://ns.flur.ee/';
    const context2 = 'https://example.com/';
    const result = mergeContexts(context1, context2);
    expect(result).toEqual(['https://ns.flur.ee/', 'https://example.com/']);
  });
  it('can merge array contexts', () => {
    const context1 = ['https://ns.flur.ee/', 'https://example.com/'];
    const context2 = ['https://example.com/', { ex: 'https://example.com/' }];
    const result = mergeContexts(context1, context2);
    expect(result).toEqual([
      'https://ns.flur.ee/',
      'https://example.com/',
      'https://example.com/',
      { ex: 'https://example.com/' },
    ]);
  });
  it('can merge string contexts with array contexts', () => {
    const context1 = 'https://ns.flur.ee/';
    const context2 = ['https://example.com/', 'https://example.com/'];
    const result1 = mergeContexts(context1, context2);
    const result2 = mergeContexts(context2, context1);
    expect(result1).toEqual([
      'https://ns.flur.ee/',
      'https://example.com/',
      'https://example.com/',
    ]);
    expect(result2).toEqual([
      'https://example.com/',
      'https://example.com/',
      'https://ns.flur.ee/',
    ]);
  });
  it('can merge string contexts with object contexts', () => {
    const context1 = 'https://ns.flur.ee/';
    const context2 = { ex: 'https://example.com/' };
    const result = mergeContexts(context1, context2);
    expect(result).toEqual([
      'https://ns.flur.ee/',
      { ex: 'https://example.com/' },
    ]);
  });
  it('can merge object contexts with other contexts', () => {
    const context1 = { ex: 'https://example.com/' };
    const context2 = 'https://ns.flur.ee/';
    const context3 = ['https://example.com/', 'https://example.com/'];
    const context4 = { ex: 'https://example.com/' };
    const result1 = mergeContexts(context1, context2);
    const result2 = mergeContexts(context1, context3);
    const result3 = mergeContexts(context1, context4);
    expect(result1).toEqual([
      { ex: 'https://example.com/' },
      'https://ns.flur.ee/',
    ]);
    expect(result2).toEqual([
      { ex: 'https://example.com/' },
      'https://example.com/',
      'https://example.com/',
    ]);
    expect(result3).toEqual({ ex: 'https://example.com/' });
  });
});
