import { ArrowLeft, GitBranch, Home, Map, PanelLeftClose, PanelLeftOpen, Search, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ApiObject, ObjectTreeNode, ObjectType } from '../../types/objects';
import { ObjectTree } from '../object-tree/ObjectTree';
import { StatusBadge } from '../status/StatusBadge';

type AppLayoutProps = {
  children: ReactNode;
  currentObject?: ApiObject | null;
  healthStatus: string;
  tree: ObjectTreeNode[];
  objectTypesById: Map<string, ObjectType>;
  selectedObjectId?: string;
  isTreeLoading: boolean;
  treeError: string | null;
  hasCurrentObjectSpatial?: boolean;
  hasCurrentObjectSchematic?: boolean;
  spatialObjectIds?: Set<string>;
  schematicObjectIds?: Set<string>;
};

export function AppLayout({
  children,
  currentObject,
  healthStatus,
  tree,
  objectTypesById,
  selectedObjectId,
  isTreeLoading,
  treeError,
  hasCurrentObjectSpatial = false,
  hasCurrentObjectSchematic = false,
  spatialObjectIds = new Set<string>(),
  schematicObjectIds = new Set<string>(),
}: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  function handleTreeSelect(objectId: string) {
    if (location.pathname === '/map' && spatialObjectIds.has(objectId)) {
      navigate(`/map?objectId=${objectId}`);
      return;
    }

    if (location.pathname.endsWith('/schema') && schematicObjectIds.has(objectId)) {
      navigate(`/objects/${objectId}/schema`);
      return;
    }

    navigate(`/objects/${objectId}`);
  }

  return (
    <div className="ivx-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand__mark" aria-hidden="true">
            IVX
          </div>
          <div>
            <strong>SIPES IVX</strong>
            <span>Industrial visibility exchange</span>
          </div>
        </div>

        <label className="global-search">
          <Search size={18} aria-hidden="true" />
          <input type="search" placeholder="Search objects, keys, status" aria-label="Global search" disabled />
        </label>

        <div className="header-actions">
          <StatusBadge status={healthStatus === 'connected' ? 'NORMAL' : 'UNKNOWN'} size="sm" />
          <button className="profile-placeholder" type="button" aria-label="Profile placeholder">
            <UserRound size={18} />
            <span>Operator</span>
          </button>
        </div>
      </header>

      <div className={`app-body ${isSidebarCollapsed ? 'app-body--collapsed' : ''}`}>
        <aside className="sidebar" aria-label="Object navigation">
          <div className="sidebar__header">
            {!isSidebarCollapsed && (
              <div>
                <span className="section-label">Objects</span>
                <strong>Hierarchy</strong>
              </div>
            )}
            <button
              className="icon-button"
              type="button"
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setIsSidebarCollapsed((value) => !value)}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          {!isSidebarCollapsed && (
            <ObjectTree
              nodes={tree}
              objectTypesById={objectTypesById}
              selectedObjectId={selectedObjectId}
              isLoading={isTreeLoading}
              error={treeError}
              onSelect={handleTreeSelect}
            />
          )}
        </aside>

        <main className="content-area">
          <div className="content-toolbar">
            <button className="secondary-button" type="button" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} />
              Back
            </button>
            <button className="secondary-button" type="button" onClick={() => navigate('/')}>
              <Home size={16} />
              Overview
            </button>
            {currentObject && hasCurrentObjectSpatial && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => navigate(`/map?objectId=${currentObject.id}`)}
              >
                <Map size={16} />
                Map
              </button>
            )}
            {currentObject && hasCurrentObjectSchematic && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => navigate(`/objects/${currentObject.id}/schema`)}
              >
                <GitBranch size={16} />
                Schema
              </button>
            )}
            <button
              className="secondary-button"
              disabled={!currentObject?.parent_id}
              type="button"
              onClick={() => currentObject?.parent_id && navigate(`/objects/${currentObject.parent_id}`)}
            >
              Parent Object
            </button>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
