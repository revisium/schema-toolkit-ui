import { Flex, Portal } from '@chakra-ui/react';
import {
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
} from '@chakra-ui/react/dialog';
import { FC, ReactNode } from 'react';

interface DialogLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export const DialogLayout: FC<DialogLayoutProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '700px',
}) => {
  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
      size="lg"
    >
      <Portal>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent maxWidth={maxWidth}>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>

            <DialogBody>{children}</DialogBody>

            {footer && (
              <DialogFooter>
                <Flex justify="space-between" width="100%">
                  {footer}
                </Flex>
              </DialogFooter>
            )}

            <DialogCloseTrigger />
          </DialogContent>
        </DialogPositioner>
      </Portal>
    </DialogRoot>
  );
};
