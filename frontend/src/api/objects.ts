import { apiRequest } from './client';
import type {
  ApiObject,
  HealthResponse,
  ObjectTreeNode,
  ObjectType,
  SpatialFeatureCollection,
  SpatialObject,
} from '../types/objects';

export function getHealth() {
  return apiRequest<HealthResponse>('/api/health');
}

export function listObjectTypes() {
  return apiRequest<ObjectType[]>('/api/object-types');
}

export function listObjects() {
  return apiRequest<ApiObject[]>('/api/objects');
}

export function getObjectTree() {
  return apiRequest<ObjectTreeNode[]>('/api/objects/tree');
}

export function getObject(objectId: string) {
  return apiRequest<ApiObject>(`/api/objects/${objectId}`);
}

export function getObjectChildren(objectId: string) {
  return apiRequest<ApiObject[]>(`/api/objects/${objectId}/children`);
}

export function getObjectParent(objectId: string) {
  return apiRequest<ApiObject | null>(`/api/objects/${objectId}/parent`);
}

export function getObjectAncestors(objectId: string) {
  return apiRequest<ApiObject[]>(`/api/objects/${objectId}/ancestors`);
}

export function getObjectSpatial(objectId: string) {
  return apiRequest<SpatialObject>(`/api/spatial/object/${objectId}`);
}

export function getSpatialGeoJson(bbox?: string) {
  const query = bbox ? `?bbox=${encodeURIComponent(bbox)}` : '';
  return apiRequest<SpatialFeatureCollection>(`/api/spatial/geojson${query}`);
}
