import { Box, CircleGauge, Move } from 'lucide-react';
import type { PointerEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import type { ApiObject, ObjectType, ObjectView, ViewElement } from '../../types/objects';
import { getObjectTypeName } from '../../utils/objectTypes';
import { EmptyState } from '../common/EmptyState';
import { StatusBadge } from '../status/StatusBadge';

type SchematicViewProps = {
  view: ObjectView;
  objectsById: Map<string, ApiObject>;
  objectTypesById: Map<string, ObjectType>;
  onOpenObject: (objectId: string) => void;
  onUpdateLayout: (elementId: string, layout: ViewElement['layout']) => Promise<void>;
};

type DragState = {
  elementId: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  hasMoved: boolean;
};

export function SchematicView({
  view,
  objectsById,
  objectTypesById,
  onOpenObject,
  onUpdateLayout,
}: SchematicViewProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [draftLayouts, setDraftLayouts] = useState<Record<string, ViewElement['layout']>>({});
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [saveState, setSaveState] = useState<string | null>(null);
  const canvas = getCanvasConfiguration(view.configuration);

  const elements = useMemo(
    () =>
      view.elements.map((element) => ({
        element,
        object: objectsById.get(element.object_id) ?? null,
        layout: { ...element.layout, ...draftLayouts[element.id] },
      })),
    [draftLayouts, objectsById, view.elements],
  );

  if (view.elements.length === 0) {
    return <EmptyState message="This schematic has no elements yet." />;
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, element: ViewElement) {
    const layout = { ...element.layout, ...draftLayouts[element.id] };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragState({
      elementId: element.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: Number(layout.x ?? 0),
      originY: Number(layout.y ?? 0),
      hasMoved: false,
    });
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!dragState) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const hasMoved = dragState.hasMoved || Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3;
    setDragState({ ...dragState, hasMoved });
    if (!hasMoved) {
      return;
    }

    const element = view.elements.find((item) => item.id === dragState.elementId);
    if (!element) {
      return;
    }

    setDraftLayouts((current) => ({
      ...current,
      [element.id]: {
        ...element.layout,
        ...current[element.id],
        x: Math.max(0, dragState.originX + deltaX),
        y: Math.max(0, dragState.originY + deltaY),
      },
    }));
  }

  async function handlePointerUp(event: PointerEvent<HTMLButtonElement>, element: ViewElement) {
    if (!dragState || dragState.elementId !== element.id) {
      return;
    }

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setDragState(null);

    if (!dragState.hasMoved) {
      onOpenObject(element.object_id);
      return;
    }

    const nextLayout = { ...element.layout, ...draftLayouts[element.id] };
    setSaveState('Saving schematic layout');
    try {
      await onUpdateLayout(element.id, nextLayout);
      setSaveState('Schematic layout saved');
    } catch {
      setSaveState('Could not save schematic layout');
    }
  }

  return (
    <div
      className="schematic-canvas"
      ref={canvasRef}
      style={{ minHeight: `${canvas.height}px` }}
      role="group"
      aria-label={view.name}
    >
      <div className="schematic-grid" aria-hidden="true" />
      <div className="schematic-flow-line" aria-hidden="true" />
      {elements.map(({ element, object, layout }) => (
        <button
          className={`schematic-element schematic-element--${String(layout.shape ?? 'node')}`}
          key={element.id}
          type="button"
          style={{
            left: `${Number(layout.x ?? 0)}px`,
            top: `${Number(layout.y ?? 0)}px`,
            width: `${Number(layout.width ?? 180)}px`,
            minHeight: `${Number(layout.height ?? 96)}px`,
          }}
          onPointerDown={(event) => handlePointerDown(event, element)}
          onPointerMove={handlePointerMove}
          onPointerUp={(event) => handlePointerUp(event, element)}
        >
          <span className="schematic-element__move" aria-hidden="true">
            <Move size={14} />
          </span>
          {String(layout.shape) === 'fan' ? <CircleGauge size={24} /> : <Box size={24} />}
          <span>
            <strong>{object?.name ?? 'Missing object'}</strong>
            <small>{object ? getObjectTypeName(object.object_type_id, objectTypesById) : element.object_id}</small>
          </span>
          {object ? <StatusBadge status={object.status} size="sm" /> : <StatusBadge status="UNKNOWN" size="sm" />}
        </button>
      ))}
      {saveState && <span className="schematic-save-state">{saveState}</span>}
    </div>
  );
}

function getCanvasConfiguration(configuration: Record<string, unknown>) {
  const canvas = configuration.canvas;
  if (!canvas || typeof canvas !== 'object') {
    return { width: 900, height: 420 };
  }

  return {
    width: Number('width' in canvas ? canvas.width : 900),
    height: Number('height' in canvas ? canvas.height : 420),
  };
}
