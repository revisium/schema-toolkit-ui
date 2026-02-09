import { FC, ReactNode, useCallback } from 'react';
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
  const handleClick = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
    }
  }, [disabled, setIsOpen]);

  return (
    <Popover.Root
      lazyMount
      unmountOnExit
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
      autoFocus={false}
      closeOnInteractOutside={!disabled}
      modal={false}
      positioning={{ placement: 'bottom-start' }}
    >
      <Popover.Trigger asChild>
        <Box onClick={handleClick}>{trigger}</Box>
      </Popover.Trigger>
      {!disabled && (
        <Portal>
          <Popover.Positioner>
            <Popover.Content width={width} p={1}>
              {children}
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      )}
    </Popover.Root>
  );
};
