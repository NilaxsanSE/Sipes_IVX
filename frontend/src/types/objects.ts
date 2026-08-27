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
