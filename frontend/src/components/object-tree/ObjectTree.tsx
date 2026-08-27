import { ChevronDown, ChevronRight, Factory } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ObjectTreeNode, ObjectType } from '../../types/objects';
import { getObjectTypeName } from '../../utils/objectTypes';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { LoadingState } from '../common/LoadingState';
import { StatusBadge } from '../status/StatusBadge';

type ObjectTreeProps = {
  nodes: ObjectTreeNode[];
  objectTypesById: Map<string, ObjectType>;
  selectedObjectId?: string;
  isLoading?: boolean;
  error?: string | null;
  onSelect: (objectId: string) => void;
};

export function ObjectTree({
  nodes,
  objectTypesById,
  selectedObjectId,
  isLoading = false,
  error = null,
  onSelect,
}: ObjectTreeProps) {
  const defaultExpanded = useMemo(() => collectExpandableNodeIds(nodes), [nodes]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(defaultExpanded);

  if (isLoading) {
    return <LoadingState label="Loading object hierarchy" />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (nodes.length === 0) {
    return <EmptyState message="No objects available." />;
  }

  function toggleNode(objectId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(objectId)) {
        next.delete(objectId);
      } else {
        next.add(objectId);
      }
      return next;
    });
  }

  return (
    <nav aria-label="Object hierarchy" className="object-tree">
      {nodes.map((node) => (
        <ObjectTreeItem
          key={node.id}
          node={node}
          objectTypesById={objectTypesById}
          selectedObjectId={selectedObjectId}
          depth={0}
          isExpanded={expandedIds.has(node.id)}
          expandedIds={expandedIds}
          onToggle={toggleNode}
          onSelect={onSelect}
        />
      ))}
    </nav>
  );
}

type ObjectTreeItemProps = {
  node: ObjectTreeNode;
  objectTypesById: Map<string, ObjectType>;
  selectedObjectId?: string;
  depth: number;
  isExpanded: boolean;
  expandedIds: Set<string>;
  onToggle: (objectId: string) => void;
  onSelect: (objectId: string) => void;
};

function ObjectTreeItem({
  node,
  objectTypesById,
  selectedObjectId,
  depth,
  isExpanded,
  expandedIds,
  onToggle,
  onSelect,
}: ObjectTreeItemProps) {
  const hasChildren = node.children.length > 0;
  const typeName = getObjectTypeName(node.object_type_id, objectTypesById);

  return (
    <div className="object-tree__branch">
      <div
        className={`object-tree__row ${selectedObjectId === node.id ? 'object-tree__row--selected' : ''}`}
        style={{ paddingLeft: `${depth * 18 + 8}px` }}
      >
        <button
          aria-label={hasChildren ? `${isExpanded ? 'Collapse' : 'Expand'} ${node.name}` : `${node.name} has no children`}
          className="icon-button object-tree__toggle"
          disabled={!hasChildren}
          type="button"
          onClick={() => onToggle(node.id)}
        >
          {hasChildren ? isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} /> : null}
        </button>
        <button className="object-tree__select" type="button" onClick={() => onSelect(node.id)}>
          <Factory size={15} aria-hidden="true" />
          <span className="object-tree__name" title={node.name}>
            {node.name}
          </span>
          <span className="object-tree__type" title={typeName}>
            {typeName}
          </span>
          <StatusBadge status={node.status} size="sm" />
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div className="object-tree__children">
          {node.children.map((child) => (
            <ObjectTreeItem
              key={child.id}
              node={child}
              objectTypesById={objectTypesById}
              selectedObjectId={selectedObjectId}
              depth={depth + 1}
              isExpanded={expandedIds.has(child.id)}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function collectExpandableNodeIds(nodes: ObjectTreeNode[]) {
  const ids = new Set<string>();

  function visit(node: ObjectTreeNode) {
    if (node.children.length > 0) {
      ids.add(node.id);
      node.children.forEach(visit);
    }
  }

  nodes.forEach(visit);
  return ids;
}
