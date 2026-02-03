import {
  Box,
  Checkbox,
  Input,
  Popover,
  Portal,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { PiTrash } from 'react-icons/pi';
import { SettingsButton } from '../../../components';
import type { BaseNodeVM } from '../../vm/node/BaseNodeVM';
import type { PrimitiveNodeVM } from '../../vm/node/PrimitiveNodeVM';

interface NodeSettingsProps {
  viewModel: BaseNodeVM;
  dataTestId: string;
  showDelete?: boolean;
  showFormula?: boolean;
  showDefault?: boolean;
  onDelete?: () => void;
}

export const NodeSettings: FC<NodeSettingsProps> = observer(
  ({
    viewModel,
    dataTestId,
    showDelete = true,
    showFormula = false,
    showDefault = false,
    onDelete,
  }) => {
    const handleOpenChange = (details: { open: boolean }) => {
      viewModel.setSettingsOpen(details.open);
    };

    const primitiveVM = viewModel as PrimitiveNodeVM;
    const canEditFormula = showFormula && 'setFormula' in viewModel;
    const canEditDefault = showDefault && 'setDefault' in viewModel;

    const canDelete =
      'canDelete' in viewModel
        ? (viewModel as PrimitiveNodeVM).canDelete
        : true;
    const deleteBlockedReason =
      'deleteBlockedReason' in viewModel
        ? (viewModel as PrimitiveNodeVM).deleteBlockedReason
        : null;
    const formulaDependents =
      'formulaDependents' in viewModel
        ? (viewModel as PrimitiveNodeVM).formulaDependents
        : [];

    return (
      <Popover.Root
        positioning={{ placement: 'bottom-start', flip: true }}
        open={viewModel.isSettingsOpen}
        onOpenChange={handleOpenChange}
      >
        <Popover.Trigger asChild>
          <SettingsButton
            height="26px"
            color="gray.300"
            _hover={{ color: 'gray.400' }}
            dataTestId={dataTestId}
          />
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content width="420px" maxHeight="350px" overflow="auto">
              <Popover.Arrow />
              <Popover.Body>
                <Stack gap="3">
                  <Box>
                    <Text fontSize="xs" color="gray.500" mb="1">
                      Description
                    </Text>
                    <Textarea
                      size="sm"
                      placeholder="Add description..."
                      value={viewModel.description}
                      onChange={(e) => viewModel.setDescription(e.target.value)}
                      rows={2}
                      data-testid={`${dataTestId}-description-input`}
                    />
                  </Box>

                  <Checkbox.Root
                    size="sm"
                    checked={viewModel.isDeprecated}
                    onCheckedChange={(e) =>
                      viewModel.setDeprecated(Boolean(e.checked))
                    }
                    data-testid={`${dataTestId}-deprecated-checkbox`}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>Deprecated</Checkbox.Label>
                  </Checkbox.Root>

                  {canEditFormula && (
                    <Box>
                      <Text fontSize="xs" color="gray.500" mb="1">
                        Formula{' '}
                        {primitiveVM.hasFormula && '(field will be readOnly)'}
                      </Text>
                      <Input
                        size="sm"
                        placeholder="e.g. price * quantity"
                        value={primitiveVM.formula}
                        onChange={(e) => primitiveVM.setFormula(e.target.value)}
                        data-testid={`${dataTestId}-formula-input`}
                      />
                    </Box>
                  )}

                  {canEditDefault && (
                    <Box>
                      <Text fontSize="xs" color="gray.500" mb="1">
                        Default value ({viewModel.type})
                      </Text>
                      {viewModel.isBoolean ? (
                        <Checkbox.Root
                          size="sm"
                          checked={primitiveVM.defaultValue === true}
                          onCheckedChange={(e) =>
                            primitiveVM.setDefault(e.checked ? 'true' : 'false')
                          }
                          data-testid={`${dataTestId}-default-checkbox`}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>true</Checkbox.Label>
                        </Checkbox.Root>
                      ) : (
                        <Input
                          size="sm"
                          type={viewModel.isNumber ? 'number' : 'text'}
                          placeholder={
                            viewModel.isNumber ? '0' : 'default value'
                          }
                          value={primitiveVM.defaultValueAsString}
                          onChange={(e) =>
                            primitiveVM.setDefault(e.target.value)
                          }
                          data-testid={`${dataTestId}-default-input`}
                        />
                      )}
                    </Box>
                  )}

                  {formulaDependents.length > 0 && (
                    <Box>
                      <Text fontSize="xs" color="gray.500" mb="1">
                        Used by formulas
                      </Text>
                      <Stack gap="1">
                        {formulaDependents.map((nodeId) => (
                          <Box
                            key={nodeId}
                            fontSize="sm"
                            color="gray.600"
                            bg="gray.50"
                            px="2"
                            py="1"
                            borderRadius="sm"
                            _dark={{ bg: 'gray.700', color: 'gray.300' }}
                          >
                            <Text fontWeight="medium">{nodeId}</Text>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {showDelete && (
                    <Box
                      as="button"
                      display="flex"
                      alignItems="center"
                      gap="2"
                      color={canDelete ? 'red.500' : 'gray.400'}
                      fontSize="sm"
                      cursor={canDelete ? 'pointer' : 'not-allowed'}
                      _hover={canDelete ? { color: 'red.600' } : undefined}
                      onClick={canDelete ? onDelete : undefined}
                      title={deleteBlockedReason ?? undefined}
                      data-testid={`${dataTestId}-delete-button`}
                    >
                      <PiTrash />
                      <Text>Delete field</Text>
                    </Box>
                  )}
                </Stack>
              </Popover.Body>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    );
  },
);
