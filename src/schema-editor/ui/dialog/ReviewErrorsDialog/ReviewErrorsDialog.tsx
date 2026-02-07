import { Box, Text, VStack } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import type { ReviewErrorsDialogVM } from '../../../model/dialog';
import {
  DialogLayout,
  DialogFooterActions,
  ErrorItem,
  RevertButton,
} from '../shared';

interface ReviewErrorsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vm: ReviewErrorsDialogVM;
}

export const ReviewErrorsDialog: FC<ReviewErrorsDialogProps> = observer(
  ({ isOpen, onClose, vm }) => {
    return (
      <DialogLayout
        isOpen={isOpen}
        onClose={onClose}
        title={`Review Errors for "${vm.tableId}"`}
        footer={
          <DialogFooterActions
            leftContent={
              vm.canRevert ? <RevertButton onRevert={vm.revert} /> : undefined
            }
            onCancel={onClose}
            showConfirm={false}
          />
        }
      >
        <VStack align="stretch" gap={4}>
          <Box
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            bg="gray.50"
            overflow="hidden"
          >
            <Box
              py={2}
              px={4}
              bg="gray.100"
              borderBottom="1px solid"
              borderColor="gray.200"
            >
              <Text fontSize="sm" fontWeight="medium" color="gray.600">
                Please fix the following errors before applying changes:
              </Text>
            </Box>
            <VStack
              align="stretch"
              gap={0}
              divideY="1px"
              divideColor="gray.100"
            >
              {vm.tableIdError && (
                <ErrorItem
                  key="tableId-error"
                  message={vm.tableIdError}
                  type="tableId"
                />
              )}
              {vm.validationErrors.map((error) => (
                <ErrorItem
                  key={`validation-${error.nodeId}`}
                  message={error.message}
                  type="validation"
                />
              ))}
              {vm.formulaErrors.map((error) => (
                <ErrorItem
                  key={`formula-${error.fieldPath ?? ''}-${error.message}`}
                  message={error.message}
                  type="formula"
                  fieldPath={error.fieldPath}
                />
              ))}
            </VStack>
          </Box>
        </VStack>
      </DialogLayout>
    );
  },
);
