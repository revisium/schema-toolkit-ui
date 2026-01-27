import {
  draggable,
  dropTargetForElements,
  monitorForElements,
  type ElementEventBasePayload,
  type ElementDropTargetEventPayloadMap,
} from '@atlaskit/drag-and-drop/adapter/element';
import type { CleanupFn } from '@atlaskit/drag-and-drop/types';
import { useEffect, useRef, useState } from 'react';
import type { BaseNodeVM } from '../../vm/BaseNodeVM';
import type { ObjectNodeVM } from '../../vm/ObjectNodeVM';

type DragAndDropData = Record<string, unknown> & {
  viewModel: BaseNodeVM;
};

const getDragData = (data: Record<string, unknown>): BaseNodeVM | null => {
  const viewModel = data.viewModel;
  if (viewModel && typeof viewModel === 'object' && 'nodeId' in viewModel) {
    return viewModel as BaseNodeVM;
  }
  return null;
};

interface UseDragAndDropOptions {
  viewModel: BaseNodeVM;
  onDrop?: (fromNodeId: string) => void;
}

export const useDragAndDrop = ({
  viewModel,
  onDrop,
}: UseDragAndDropOptions) => {
  const dragAndDropRef = useRef<HTMLDivElement | null>(null);
  const [isDrop, setIsDrop] = useState(false);
  const [isDisabledDrop, setIsDisabledDrop] = useState(false);
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  const isDraggable = viewModel.canDrag;
  const isDropTarget = viewModel.isValidDropTarget;

  useEffect(() => {
    if (!isDraggable || !dragAndDropRef.current) {
      return;
    }

    const cleanup: CleanupFn = draggable({
      element: dragAndDropRef.current,
      getInitialData: (): DragAndDropData => ({ viewModel }),
    });

    return () => cleanup();
  }, [viewModel, isDraggable]);

  useEffect(() => {
    if (!isDropTarget || !dragAndDropRef.current) {
      return;
    }

    const cleanup: CleanupFn = dropTargetForElements({
      element: dragAndDropRef.current,
      onDrop: (e: ElementDropTargetEventPayloadMap['onDrop']) => {
        const draggingViewModel = getDragData(e.source.data);

        if (
          draggingViewModel &&
          viewModel.canAcceptDrop(draggingViewModel.nodeId)
        ) {
          if (onDrop) {
            onDrop(draggingViewModel.nodeId);
          } else if ('moveNodeHere' in viewModel) {
            (viewModel as ObjectNodeVM).moveNodeHere(draggingViewModel.nodeId);
          }
        }

        setIsDraggedOver(false);
        setIsDrop(false);
      },
      onDragEnter: (e: ElementDropTargetEventPayloadMap['onDragEnter']) => {
        const draggingViewModel = getDragData(e.source.data);
        if (draggingViewModel) {
          setIsDraggedOver(viewModel.canAcceptDrop(draggingViewModel.nodeId));
        }
      },
      onDragLeave: () => setIsDraggedOver(false),
    });

    return () => cleanup();
  }, [viewModel, isDropTarget, onDrop]);

  useEffect(() => {
    return monitorForElements({
      onDragStart: (e: ElementEventBasePayload) => {
        const draggingViewModel = getDragData(e.source.data);

        if (!draggingViewModel) {
          return;
        }

        if (isDropTarget) {
          const canAccept = viewModel.canAcceptDrop(draggingViewModel.nodeId);

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
  }, [viewModel, isDropTarget]);

  return {
    dragAndDropRef,
    isDraggable,
    isDrop,
    isDisabledDrop,
    isDraggedOver,
  };
};
