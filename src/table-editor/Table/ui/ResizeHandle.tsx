import { observer } from 'mobx-react-lite';
import { Box } from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ColumnsModel } from '../../Columns/model/ColumnsModel.js';

const MIN_COLUMN_WIDTH = 40;

interface ResizeHandleProps {
  field: string;
  columnsModel: ColumnsModel;
}

export const ResizeHandle = observer(
  ({ field, columnsModel }: ResizeHandleProps) => {
    const [isResizing, setIsResizing] = useState(false);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);
    const rafRef = useRef(0);
    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
      return () => {
        if (cleanupRef.current) {
          cleanupRef.current();
        }
      };
    }, []);

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const currentWidth = columnsModel.resolveColumnWidth(field);
        startXRef.current = e.clientX;
        startWidthRef.current = currentWidth;
        setIsResizing(true);

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const handleMouseMove = (moveEvent: MouseEvent) => {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(() => {
            const delta = moveEvent.clientX - startXRef.current;
            const newWidth = Math.max(
              MIN_COLUMN_WIDTH,
              startWidthRef.current + delta,
            );
            columnsModel.setColumnWidth(field, newWidth);
          });
        };

        const cleanup = () => {
          cancelAnimationFrame(rafRef.current);
          columnsModel.commitColumnWidth();
          setIsResizing(false);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          cleanupRef.current = null;
        };

        const handleMouseUp = () => {
          cleanup();
        };

        cleanupRef.current = cleanup;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      },
      [field, columnsModel],
    );

    return (
      <Box
        role="separator"
        position="absolute"
        right="-4px"
        top={0}
        bottom={0}
        width="8px"
        cursor="col-resize"
        zIndex={10}
        onMouseDown={handleMouseDown}
        data-testid={`resize-${field}`}
      >
        <Box
          position="absolute"
          left="3px"
          top={0}
          bottom={0}
          width="2px"
          bg={isResizing ? 'blue.500' : 'transparent'}
          _groupHover={{ bg: 'blue.500' }}
          transition="background 0.1s"
        />
      </Box>
    );
  },
);
