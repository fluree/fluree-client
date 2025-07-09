import {
  ContextWithInsertObject,
  ContextWithInsertStatement,
  InsertStatement,
  UpsertStatement,
} from 'src/types/TransactionTypes';
import { ContextMap, ContextStatement } from '../types/ContextTypes';

/**
 * Merges two context maps, removing keys from the first context that map to values
 * that the second context also maps to, unless they are the same key.
 * The second context's mappings take precedence.
 * @param context1 the first context map
 * @param context2 the second context map
 * @returns a new context map that is the result of merging context2 into context1
 */
function mergeObjectContexts(
  context1: ContextMap,
  context2: ContextMap,
): ContextMap {
  const result = { ...context1 };

  // Remove keys from context1 that map to values that context2 also maps to
  for (const [key2, value2] of Object.entries(context2)) {
    for (const [key1, value1] of Object.entries(context1)) {
      if (value1 === value2 && key1 !== key2) {
        delete result[key1];
      }
    }
  }

  // Add context2's mappings (these take precedence)
  return { ...result, ...context2 };
}

/**
 *
 * @param context1 the base context to merge a new context into
 * @param context2 the new context to merge into the base context
 * @returns a new context that is the result of merging context2 into context1
 */
export function mergeContexts(
  context1: ContextStatement,
  context2: ContextStatement,
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
      // Both are objects - need to handle conflicts
      return mergeObjectContexts(context1, context2);
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

/**
 * Check if the object is a ContextWithInsertStatement
 * @param obj the object to check
 * @returns true if the object is a ContextWithInsertStatement, false otherwise
 */
export function isContextWithInsertStatment(
  obj: UpsertStatement,
): obj is ContextWithInsertStatement {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '@context' in obj &&
    '@graph' in obj
  );
}

/**
 * Check if the object is a ContextWithInsertObject
 * @param obj the object to check
 * @returns true if the object is a ContextWithInsertObject, false otherwise
 */
export function isContextWithInsertObject(
  obj: UpsertStatement,
): obj is ContextWithInsertObject {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '@context' in obj &&
    !('@graph' in obj)
  );
}

/**
 * Check if the object is an UpsertStatement with a context
 * @param obj the object to check
 * @returns true if the object is an UpsertStatement with a context, false otherwise
 */
export function isUpsertWithContext(
  obj: UpsertStatement,
): obj is ContextWithInsertStatement | ContextWithInsertObject {
  return isContextWithInsertStatment(obj) || isContextWithInsertObject(obj);
}

/**
 * Check if the object is a plain InsertStatement
 * @param obj the object to check
 * @returns true if the object is a plain InsertStatement, false otherwise
 */
export function isInsertStatement(
  obj: UpsertStatement,
): obj is InsertStatement {
  return typeof obj === 'object' && obj !== null && !('@context' in obj);
}

/**
 * Extracts the context and body from an UpsertStatement.
 * If the statement is an InsertStatement, it returns the body as is.
 * If it has a context, it separates the context and body.
 * @param transaction the UpsertStatement to extract from
 * @returns an object containing the context and body
 */
export function extractContextAndBody(transaction: UpsertStatement) {
  if (isInsertStatement(transaction)) {
    return { context: undefined, body: transaction };
  } else if (isContextWithInsertObject(transaction)) {
    const { '@context': context, ...body } = transaction;
    return { context, body };
  } else {
    return {
      context: transaction['@context'],
      body: transaction['@graph'],
    };
  }
}

/**
 * Resolves the ID alias from the local context or the default context.
 * If the local context has a different alias than '@id', it returns that.
 * If not, it checks the default context for an alias.
 * If both contexts use '@id', it returns '@id'.
 * @param localContext the local context to check
 * @param defaultContext the default context to check
 * @returns the resolved ID alias
 */
export function resolveIdAlias(
  localContext?: ContextStatement,
  defaultContext?: ContextStatement,
) {
  const localIdAlias = findIdAlias(localContext || {});
  const defaultIdAlias = findIdAlias(defaultContext || {});

  return localIdAlias !== '@id'
    ? localIdAlias
    : defaultIdAlias !== '@id'
    ? defaultIdAlias
    : '@id';
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
