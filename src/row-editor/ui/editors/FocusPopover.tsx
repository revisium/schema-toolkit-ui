import { FC, ReactNode, useRef, useCallback } from 'react';
import { Popover, Portal, Box } from '@chakra-ui/react';

interface FocusPopoverProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  disabled?: boolean;
  width?: string;
}

export const FocusPopover: FC<FocusPopoverProps> = ({
  isOpen,
  setIsOpen,
  trigger,
  children,
  disabled,
  width,
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const lastRectRef = useRef<DOMRect | null>(null);

  const getAnchorRect = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0) {
      lastRectRef.current = rect;
    }
    return lastRectRef.current;
  }, []);

  const handlePointerDown = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
    }
  }, [disabled, setIsOpen]);

  return (
    <>
      <Box ref={triggerRef} onPointerDown={handlePointerDown}>
        {trigger}
      </Box>
      {!disabled && (
        <Popover.Root
          lazyMount
          unmountOnExit
          open={isOpen}
          onOpenChange={({ open }) => setIsOpen(open)}
          autoFocus={false}
          closeOnInteractOutside={true}
          modal={false}
          positioning={{
            placement: 'bottom-start',
            getAnchorRect,
          }}
        >
          <Portal>
            <Popover.Positioner>
              <Popover.Content width={width} p={1}>
                {children}
              </Popover.Content>
            </Popover.Positioner>
          </Portal>
        </Popover.Root>
      )}
    </>
  );
};
