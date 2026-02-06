import { Button, Flex } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';

interface DialogFooterActionsProps {
  leftContent?: ReactNode;
  onCancel: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  showConfirm?: boolean;
}

export const DialogFooterActions: FC<DialogFooterActionsProps> = ({
  leftContent,
  onCancel,
  onConfirm,
  confirmLabel = 'Confirm',
  confirmDisabled = false,
  confirmLoading = false,
  showConfirm = true,
}) => {
  return (
    <>
      {leftContent ?? <div />}
      <Flex gap={2}>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        {showConfirm && onConfirm && (
          <Button
            variant="outline"
            onClick={onConfirm}
            disabled={confirmDisabled}
            loading={confirmLoading}
          >
            {confirmLabel}
          </Button>
        )}
      </Flex>
    </>
  );
};
