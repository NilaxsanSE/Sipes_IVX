import type { ApiObject, ObjectTreeNode, ObjectType } from '../types/objects';

const timestamp = '2026-08-27T00:00:00.000Z';
const tenantId = '11111111-1111-1111-1111-111111111111';

export const objectTypes: ObjectType[] = [
  makeObjectType('type-location', 'Location'),
  makeObjectType('type-site', 'Site'),
  makeObjectType('type-asset', 'Asset'),
];

export const objectTypesById = new Map(objectTypes.map((objectType) => [objectType.id, objectType]));

export const germany = makeObject({
  id: 'object-germany',
  object_type_id: 'type-location',
  parent_id: null,
  key: 'germany',
  name: 'Germany',
  status: 'NORMAL',
});

export const sachsen = makeObject({
  id: 'object-sachsen',
  object_type_id: 'type-location',
  parent_id: germany.id,
  key: 'sachsen',
  name: 'Sachsen',
  status: 'NORMAL',
});

export const dresden = makeObject({
  id: 'object-dresden',
  object_type_id: 'type-location',
  parent_id: sachsen.id,
  key: 'dresden',
  name: 'Dresden',
  status: 'WARNING',
});

export const fan = makeObject({
  id: 'object-fan-01',
  object_type_id: 'type-asset',
  parent_id: dresden.id,
  key: 'fan-01',
  name: 'Fan 01',
  status: 'UNKNOWN',
  properties: { rpm: 1480, bearing: { temperature: 42 } },
});

export const demoTree: ObjectTreeNode[] = [
  {
    ...germany,
    children: [
      {
        ...sachsen,
        children: [
          {
            ...dresden,
            children: [{ ...fan, children: [] }],
          },
        ],
      },
    ],
  },
];

export function makeObject(overrides: Partial<ApiObject> & Pick<ApiObject, 'id' | 'key' | 'name'>): ApiObject {
  return {
    tenant_id: tenantId,
    object_type_id: 'type-location',
    parent_id: null,
    properties: {},
    status: 'NORMAL',
    created_at: timestamp,
    updated_at: timestamp,
    ...overrides,
  };
}

export function makeTreeChain(depth: number): ObjectTreeNode[] {
  let child: ObjectTreeNode | null = null;

  for (let index = depth; index >= 1; index -= 1) {
    child = {
      ...makeObject({
        id: `deep-${index}`,
        key: `deep-${index}`,
        name: `Level ${index}`,
        parent_id: index === 1 ? null : `deep-${index - 1}`,
      }),
      children: child ? [child] : [],
    };
  }

  return child ? [child] : [];
}

function makeObjectType(id: string, name: string): ObjectType {
  return {
    id,
    key: name.toLowerCase(),
    name,
    description: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}
