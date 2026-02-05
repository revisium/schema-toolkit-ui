import {
  draggable,
  dropTargetForElements,
  monitorForElements,
  type ElementEventBasePayload,
  type ElementDropTargetEventPayloadMap,
} from '@atlaskit/drag-and-drop/adapter/element';
import type { CleanupFn } from '@atlaskit/drag-and-drop/types';
import { useEffect, useRef, useState } from 'react';
import type { NodeAccessor } from '../../../model/accessor';

type DragAndDropData = Record<string, unknown> & {
  accessor: NodeAccessor;
};

const getDragData = (data: Record<string, unknown>): NodeAccessor | null => {
  const accessor = data.accessor;
  if (accessor && typeof accessor === 'object' && 'nodeId' in accessor) {
    return accessor as NodeAccessor;
  }
  return null;
};

interface UseDragAndDropOptions {
  accessor: NodeAccessor;
  onDrop?: (fromNodeId: string) => void;
  canDrag: boolean;
  isDropTarget: boolean;
  canAcceptDrop: (fromNodeId: string) => boolean;
}

export const useDragAndDrop = ({
  accessor,
  onDrop,
  canDrag,
  isDropTarget,
  canAcceptDrop,
}: UseDragAndDropOptions) => {
  const dragAndDropRef = useRef<HTMLDivElement | null>(null);
  const [isDrop, setIsDrop] = useState(false);
  const [isDisabledDrop, setIsDisabledDrop] = useState(false);
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  useEffect(() => {
    if (!canDrag || !dragAndDropRef.current) {
      return;
    }

    const cleanup: CleanupFn = draggable({
      element: dragAndDropRef.current,
      getInitialData: (): DragAndDropData => ({ accessor }),
    });

    return () => cleanup();
  }, [accessor, canDrag]);

  useEffect(() => {
    if (!isDropTarget || !dragAndDropRef.current) {
      return;
    }

    const cleanup: CleanupFn = dropTargetForElements({
      element: dragAndDropRef.current,
      onDrop: (e: ElementDropTargetEventPayloadMap['onDrop']) => {
        const draggingAccessor = getDragData(e.source.data);

        if (draggingAccessor && canAcceptDrop(draggingAccessor.nodeId)) {
          if (onDrop) {
            onDrop(draggingAccessor.nodeId);
          }
        }

        setIsDraggedOver(false);
        setIsDrop(false);
      },
      onDragEnter: (e: ElementDropTargetEventPayloadMap['onDragEnter']) => {
        const draggingAccessor = getDragData(e.source.data);
        if (draggingAccessor) {
          setIsDraggedOver(canAcceptDrop(draggingAccessor.nodeId));
        }
      },
      onDragLeave: () => setIsDraggedOver(false),
    });

    return () => cleanup();
  }, [accessor, isDropTarget, onDrop, canAcceptDrop]);

  useEffect(() => {
    return monitorForElements({
      onDragStart: (e: ElementEventBasePayload) => {
        const draggingAccessor = getDragData(e.source.data);

        if (!draggingAccessor) {
          return;
        }

        if (isDropTarget) {
          const canAccept = canAcceptDrop(draggingAccessor.nodeId);

          if (canAccept) {
            setIsDrop(true);
          } else {
            setIsDisabledDrop(true);
          }
        } else {
          setIsDisabledDrop(true);
        }
      },
      onDrop: () => {
        setIsDrop(false);
        setIsDisabledDrop(false);
      },
    });
  }, [accessor, isDropTarget, canAcceptDrop]);

  return {
    dragAndDropRef,
    isDraggable: canDrag,
    isDrop,
    isDisabledDrop,
    isDraggedOver,
  };
};
