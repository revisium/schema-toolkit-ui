import { Box, Menu, Portal } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC, useRef } from 'react';
import { PiTrash } from 'react-icons/pi';
import { SettingsButton } from '../../../../components';
import type { NodeAccessor } from '../../../model/accessor';
import { DescriptionSubmenu } from './DescriptionSubmenu';
import { FormulaSubmenu } from './FormulaSubmenu';
import { DefaultValueSubmenu } from './DefaultValueSubmenu';

interface TreeNodeContextMenuProps {
  accessor: NodeAccessor;
  dataTestId: string;
  showDelete?: boolean;
  showFormula?: boolean;
  showDefault?: boolean;
  onDelete?: () => void;
}

export const TreeNodeContextMenu: FC<TreeNodeContextMenuProps> = observer(
  ({
    accessor,
    dataTestId,
    showDelete = true,
    showFormula = false,
    showDefault = false,
    onDelete,
  }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    const handleOpenChange = (details: { open: boolean }) => {
      accessor.state.setSettingsOpen(details.open);
    };

    const canDelete = accessor.actions.canRemove;

    return (
      <Menu.Root
        open={accessor.state.isSettingsOpen}
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
            <Menu.Content ref={contentRef} minW="220px">
              <DescriptionSubmenu accessor={accessor} dataTestId={dataTestId} />

              {showFormula && (
                <FormulaSubmenu accessor={accessor} dataTestId={dataTestId} />
              )}

              {showDefault && (
                <DefaultValueSubmenu
                  accessor={accessor}
                  dataTestId={dataTestId}
                />
              )}

              <Menu.Separator />

              <Menu.Item
                value="deprecated"
                onClick={() =>
                  accessor.actions.setDeprecated(!accessor.label.isDeprecated)
                }
                data-testid={`${dataTestId}-deprecated`}
              >
                <Box w="16px" />
                {accessor.label.isDeprecated
                  ? 'Remove deprecated'
                  : 'Mark as deprecated'}
              </Menu.Item>

              {showDelete && (
                <>
                  <Menu.Separator />
                  <Menu.Item
                    value="delete"
                    color={canDelete ? 'fg.error' : 'gray.400'}
                    disabled={!canDelete}
                    onClick={canDelete ? onDelete : undefined}
                    data-testid={`${dataTestId}-delete`}
                    _hover={
                      canDelete
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
