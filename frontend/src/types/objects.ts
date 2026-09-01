export type ObjectStatus = 'NORMAL' | 'WARNING' | 'ERROR' | 'UNKNOWN';

export type ApiObject = {
  id: string;
  tenant_id: string;
  object_type_id: string;
  parent_id: string | null;
  key: string;
  name: string;
  properties: Record<string, unknown>;
  status: ObjectStatus;
  created_at: string;
  updated_at: string;
};

export type ObjectTreeNode = ApiObject & {
  children: ObjectTreeNode[];
};

export type ObjectType = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type HealthResponse = {
  status: string;
  service: string;
  environment: string;
  database: {
    status: string;
  };
};

export type PointGeometry = {
  type: 'Point';
  coordinates: [number, number];
};

export type SpatialFeatureProperties = {
  object_id: string;
  name: string;
  key: string;
  status: ObjectStatus;
  object_type: string;
  altitude: number | null;
  source: string | null;
};

export type SpatialFeature = {
  type: 'Feature';
  geometry: PointGeometry;
  properties: SpatialFeatureProperties;
};

export type SpatialFeatureCollection = {
  type: 'FeatureCollection';
  features: SpatialFeature[];
};

export type SpatialObject = {
  id: string;
  object_id: string;
  geometry: PointGeometry;
  altitude: number | null;
  source: string | null;
  created_at: string;
  updated_at: string;
};

export type ViewType = 'SCHEMATIC';

export type ViewElement = {
  id: string;
  view_id: string;
  object_id: string;
  element_key: string;
  layout: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    shape?: string;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
};

export type ViewSummary = {
  id: string;
  object_id: string;
  type: ViewType;
  name: string;
  created_at: string;
  updated_at: string;
};

export type ObjectView = ViewSummary & {
  configuration: Record<string, unknown>;
  elements: ViewElement[];
};
