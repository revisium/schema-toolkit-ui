import { FC, useRef } from 'react';
import { Button, Flex, Portal, Text } from '@chakra-ui/react';
import {
  DialogBackdrop,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
} from '@chakra-ui/react/dialog';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count?: number;
}

export const DeleteConfirmDialog: FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  count,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  const message =
    count && count > 1
      ? `Are you sure you want to delete ${count} rows?`
      : 'Are you sure you want to delete this row?';

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) {
          onClose();
        }
      }}
      initialFocusEl={() => cancelRef.current}
      role="alertdialog"
    >
      <Portal>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent maxWidth="400px" data-testid="delete-confirm-dialog">
            <DialogHeader>
              <DialogTitle>Delete confirmation</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text>{message}</Text>
            </DialogBody>
            <DialogFooter>
              <Flex gap={2}>
                <Button
                  ref={cancelRef}
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  data-testid="delete-cancel"
                >
                  Cancel
                </Button>
                <Button
                  colorPalette="red"
                  size="sm"
                  onClick={onConfirm}
                  data-testid="delete-confirm"
                >
                  Delete
                </Button>
              </Flex>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </Portal>
    </DialogRoot>
  );
};
