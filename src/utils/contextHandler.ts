import { ContextStatement } from '../types/ContextTypes';

/**
 *
 * @param context1 the base context to merge a new context into
 * @param context2 the new context to merge into the base context
 * @returns a new context that is the result of merging context2 into context1
 */
export function mergeContexts(
  context1: ContextStatement,
  context2: ContextStatement
): ContextStatement {
  if (typeof context1 === 'string') {
    if (typeof context2 === 'string') {
      return [context1, context2];
    } else if (Array.isArray(context2)) {
      return [context1, ...context2];
    } else {
      if (Object.entries(context2).length === 0) return context1;
      return [context1, context2];
    }
  } else if (Array.isArray(context1)) {
    if (typeof context2 === 'string') {
      return [...context1, context2];
    } else if (Array.isArray(context2)) {
      return context1.concat(context2);
    } else {
      if (Object.entries(context2).length === 0) return context1;
      return context1.concat([context2]);
    }
  } else {
    if (Object.entries(context1).length === 0) return context2;
    if (typeof context2 === 'string') {
      return [context1, context2];
    } else if (Array.isArray(context2)) {
      return [context1, ...context2];
    } else {
      return { ...context1, ...context2 };
    }
  }
}

/**
 * Find the alias for a given context. This includes searching through context arrays or nested context for any value of "@id"
 * For example, if the context is ["https://ns.flur.ee/", { "ex": "https://example.com/", "id": "@id" }]
 * Then "id" is serving as an alias for "@id"
 * @param context the context to search for an alias
 * @returns the alias for the context
 */
export function findIdAlias(context: ContextStatement): string {
  if (typeof context === 'string') {
    return '@id';
  } else if (Array.isArray(context)) {
    let result = '@id';
    for (const item of context) {
      result = findIdAlias(item);
    }
    return result;
  } else {
    let result = '@id';
    for (const key in context) {
      if (context[key] === '@id') {
        result = key;
      }
    }
    return result;
  }
}

// /**
//  * Find the alias for a given context. This includes searching through context arrays or nested context for any value of "@context"
//  * For example, if the context is ["https://ns.flur.ee/", { "ex": "https://example.com/", "context": "@context" }]
//  * Then "context" is serving as an alias for "@context"
//  */
// export function findContextAlias(context: ContextStatement): string {
//   if (typeof context === 'string') {
//     return '@context';
//   } else if (Array.isArray(context)) {
//     for (const item of context) {
//       return findContextAlias(item);
//     }
//   } else {
//     let result = '@context';
//     for (const key in context) {
//       if (context[key] === '@context') {
//         result = key;
//       }
//     }
//     return result;
//   }
//   return '@context';
// }
