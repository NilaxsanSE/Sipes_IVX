import type { ObjectType } from '../types/objects';

export function createObjectTypeMap(objectTypes: ObjectType[]) {
  return new Map(objectTypes.map((objectType) => [objectType.id, objectType]));
}

export function getObjectTypeName(objectTypeId: string, objectTypesById: Map<string, ObjectType>) {
  return objectTypesById.get(objectTypeId)?.name ?? 'Unknown type';
}

export function getObjectTypeKey(objectTypeId: string, objectTypesById: Map<string, ObjectType>) {
  return objectTypesById.get(objectTypeId)?.key.toLowerCase() ?? '';
}

export function isObjectType(
  objectTypeId: string,
  objectTypesById: Map<string, ObjectType>,
  expectedKey: string,
) {
  return getObjectTypeKey(objectTypeId, objectTypesById) === expectedKey.toLowerCase();
}
