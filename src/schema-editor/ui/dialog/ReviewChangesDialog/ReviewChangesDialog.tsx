import { Box, Flex, SegmentGroup, Text, VStack } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { JsonCard } from '../../../../components/JsonCard';
import type { ReviewChangesDialogVM } from '../../../model/dialog';
import {
  DialogLayout,
  DialogFooterActions,
  PatchRow,
  TableIdChangeRow,
  RevertButton,
} from '../shared';

interface ReviewChangesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vm: ReviewChangesDialogVM;
}

export const ReviewChangesDialog: FC<ReviewChangesDialogProps> = observer(
  ({ isOpen, onClose, vm }) => {
    const applyButtonText = `Apply Changes (${vm.totalChangesCount})`;

    return (
      <DialogLayout
        isOpen={isOpen}
        onClose={onClose}
        title={`Review Changes for "${vm.tableId}"`}
        footer={
          <DialogFooterActions
            leftContent={
              <RevertButton onRevert={vm.revert} disabled={!vm.hasChanges} />
            }
            onCancel={onClose}
            onConfirm={vm.approve}
            confirmLabel={applyButtonText}
            confirmDisabled={!vm.hasChanges}
            confirmLoading={vm.loading}
          />
        }
      >
        <VStack align="stretch" gap={4}>
          {vm.hasChanges ? (
            <>
              <SegmentGroup.Root
                size="sm"
                value={vm.viewMode}
                onValueChange={(details) =>
                  vm.setViewMode(details.value as 'Changes' | 'Patches')
                }
              >
                <SegmentGroup.Indicator />
                <SegmentGroup.Items items={['Changes', 'Patches']} />
              </SegmentGroup.Root>

              <Box
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                overflow="hidden"
                maxHeight="400px"
                overflowY="auto"
              >
                {vm.viewMode === 'Changes' ? (
                  <>
                    {vm.tableIdChange && (
                      <TableIdChangeRow change={vm.tableIdChange} />
                    )}
                    {vm.patches.map((schemaPatch) => (
                      <PatchRow
                        key={`${schemaPatch.patch.op}:${schemaPatch.patch.path}`}
                        schemaPatch={schemaPatch}
                      />
                    ))}
                  </>
                ) : (
                  <JsonCard readonly data={vm.patches.map((p) => p.patch)} />
                )}
              </Box>

              <Text fontSize="xs" color="gray.500">
                Data in existing rows will be automatically transformed
                according to the new schema.
              </Text>
            </>
          ) : (
            <Flex justify="center" align="center" minHeight="100px">
              <Text color="gray.400" fontSize="sm">
                No changes to apply
              </Text>
            </Flex>
          )}
        </VStack>
      </DialogLayout>
    );
  },
);
