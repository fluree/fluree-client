/* eslint-disable jsdoc/require-jsdoc */
import { IFlureeTransaction } from '../interfaces/IFlureeTransaction';
import { DeleteStatement, InsertStatement } from '../types/TransactionTypes';
import { WhereArray, WhereCondition } from '../types/WhereTypes';

type Entity = {
  [key: string]:
    | string
    | string[]
    | number
    | number[]
    | Entity
    | Entity[]
    | (string | number | Entity)[];
};

type EntityMap = {
  [key: string]: Entity;
};

function processEntity(entity: Entity, map: EntityMap, idAlias: string): void {
  const entityId = entity[idAlias];
  /* istanbul ignore next */
  if (typeof entityId !== 'string') {
    throw new Error('Entity must have an ID');
  }
  if (typeof entityId === 'string' && !map[entityId]) {
    // Initialize the entity in the map with its ID
    map[entityId] = { [idAlias]: entityId };
  }

  Object.keys(entity).forEach((key) => {
    const value = entity[key];
    if (Array.isArray(value)) {
      map[entityId][key] = value.map((item) => {
        if (typeof item === 'object' && item[idAlias]) {
          // Process nested entities and return a reference
          processEntity(item, map, idAlias);
          return { [idAlias]: item[idAlias] };
        }
        return item; // Return non-entity items directly
      });
    } else if (typeof value === 'object' && value !== null && value[idAlias]) {
      // Process a single nested entity and store a reference
      processEntity(value, map, idAlias);
      map[entityId][key] = { [idAlias]: value[idAlias] };
    } else if (key !== idAlias) {
      // Copy direct properties
      map[entityId][key] = value;
    }
  });
}

export function flattenTxn(txn: InsertStatement, idAlias: string) {
  return flattenEntity(txn as Entity, idAlias);
}

function flattenEntity(input: Entity | Entity[], idAlias: string): EntityMap {
  const map: EntityMap = {};
  const txns = Array.isArray(input) ? input : [input];
  txns.forEach((txn) => processEntity(txn, map, idAlias));
  for (const key in map) {
    if (Object.entries(map[key]).length === 1) {
      delete map[key];
    }
  }
  return map;
}

export function convertTxnToWhereDelete(
  flattenedTxn: EntityMap,
  idAlias: string
): [WhereArray, DeleteStatement] {
  const whereClause: WhereArray = [];
  const deleteClause: DeleteStatement = [];
  let i = 1;
  for (const key in flattenedTxn) {
    const entity = flattenedTxn[key];
    const entityKeys = Object.keys(entity).filter((k) => k !== idAlias);
    const whereEntity: WhereCondition = { [idAlias]: key };
    entityKeys.forEach((k) => {
      const expression = { ...whereEntity, [k]: `?${i}` };
      whereClause.push(['optional', expression]);
      deleteClause.push(expression);
      i++;
    });
  }
  return [whereClause, deleteClause];
}

export function generateWhereDeleteForIds(
  ids: string[],
  idAlias: string
): WhereArray {
  const where: WhereArray = [];
  for (const index in ids) {
    where.push({
      [idAlias]: ids[index], 
      [`?p${index}`]: `?o${index}`
    });
  }
  return where;
}

export const handleUpsert = (
  upsertTxn: InsertStatement,
  idAlias: string
): IFlureeTransaction => {
  const flattenedTxn = flattenTxn(upsertTxn, idAlias);
  const [whereClause, deleteClause] = convertTxnToWhereDelete(
    flattenedTxn,
    idAlias
  );

  return {
    where: whereClause,
    delete: deleteClause,
    insert: upsertTxn,
  };
};

export const handleDelete = (
  id: string | string[],
  idAlias: string
): IFlureeTransaction => {
  const idList = !Array.isArray(id) ? [id] : id;

  const whereDelete = generateWhereDeleteForIds(idList, idAlias);

  return {
    where: whereDelete as WhereStatement,
    delete: whereDelete as DeleteStatement
  };
};
