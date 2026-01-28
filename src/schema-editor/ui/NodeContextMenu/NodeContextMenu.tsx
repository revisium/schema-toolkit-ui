import { Box, Menu, Portal } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { PiTrash } from 'react-icons/pi';
import { SettingsButton } from '../../../components';
import type { BaseNodeVM } from '../../vm/BaseNodeVM';
import { DescriptionSubmenu } from './DescriptionSubmenu';
import { FormulaSubmenu } from './FormulaSubmenu';
import { DefaultValueSubmenu } from './DefaultValueSubmenu';
import { UsedByFormulasSubmenu } from './UsedByFormulasSubmenu';

interface NodeContextMenuProps {
  viewModel: BaseNodeVM;
  dataTestId: string;
  showDelete?: boolean;
  showFormula?: boolean;
  showDefault?: boolean;
  onDelete?: () => void;
}

export const NodeContextMenu: FC<NodeContextMenuProps> = observer(
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

    return (
      <Menu.Root
        open={viewModel.isSettingsOpen}
        onOpenChange={handleOpenChange}
        positioning={{ placement: 'bottom-start' }}
      >
        <Menu.Trigger asChild>
          <SettingsButton
            height="26px"
            color="gray.300"
            _hover={{ color: 'gray.400' }}
            dataTestId={dataTestId}
          />
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content minW="220px">
              <DescriptionSubmenu
                viewModel={viewModel}
                dataTestId={dataTestId}
              />

              {showFormula && (
                <FormulaSubmenu viewModel={viewModel} dataTestId={dataTestId} />
              )}

              {showDefault && (
                <DefaultValueSubmenu
                  viewModel={viewModel}
                  dataTestId={dataTestId}
                />
              )}

              <Menu.Separator />

              <Menu.Item
                value="deprecated"
                onClick={() => viewModel.setDeprecated(!viewModel.isDeprecated)}
                data-testid={`${dataTestId}-deprecated`}
              >
                <Box w="16px" />
                {viewModel.isDeprecated
                  ? 'Remove deprecated'
                  : 'Mark as deprecated'}
              </Menu.Item>

              <UsedByFormulasSubmenu
                formulaDependents={viewModel.formulaDependents}
              />

              {showDelete && (
                <>
                  <Menu.Separator />
                  <Menu.Item
                    value="delete"
                    color={viewModel.canDelete ? 'fg.error' : 'gray.400'}
                    disabled={!viewModel.canDelete}
                    onClick={viewModel.canDelete ? onDelete : undefined}
                    title={viewModel.deleteBlockedReason ?? undefined}
                    data-testid={`${dataTestId}-delete`}
                    _hover={
                      viewModel.canDelete
                        ? { bg: 'bg.error', color: 'fg.error' }
                        : undefined
                    }
                  >
                    <PiTrash />
                    <Box flex="1">Delete field</Box>
                  </Menu.Item>
                </>
              )}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    );
  },
);
