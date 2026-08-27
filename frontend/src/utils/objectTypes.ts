import type { ObjectType } from '../types/objects';

export function createObjectTypeMap(objectTypes: ObjectType[]) {
  return new Map(objectTypes.map((objectType) => [objectType.id, objectType]));
}

export function getObjectTypeName(objectTypeId: string, objectTypesById: Map<string, ObjectType>) {
  return objectTypesById.get(objectTypeId)?.name ?? 'Unknown type';
}
