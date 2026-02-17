import { FC, useContext } from 'react';
import { Box, Kbd, Menu, Portal } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { CellVM } from '../../model/CellVM.js';
import { CellContextActionsContext } from './CellContextActionsContext.js';

interface CellContextMenuProps {
  cell: CellVM;
  onEditPointerDown?: () => void;
}

export const CellContextMenu: FC<CellContextMenuProps> = observer(
  ({ cell, onEditPointerDown }) => {
    const rangeActions = useContext(CellContextActionsContext);
    const hasRange = cell.hasRangeSelection;

    const handleCopyValue = () => {
      void cell.copyToClipboard();
    };

    const handleCopyJsonPath = () => {
      void navigator.clipboard.writeText(cell.jsonPath);
    };

    const handlePaste = () => {
      void cell.pasteFromClipboard();
    };

    const handleClear = () => {
      cell.clearToDefault();
    };

    const handleCopyRange = () => {
      rangeActions?.copyRange();
    };

    const handlePasteRange = () => {
      rangeActions?.pasteRange();
    };

    const handleClearRange = () => {
      rangeActions?.clearRange();
    };

    return (
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="180px">
            {hasRange && rangeActions ? (
              <>
                <Menu.Item value="copy-range" onClick={handleCopyRange}>
                  <Box flex="1">Copy</Box>
                  <Kbd size="sm">⌘C</Kbd>
                </Menu.Item>
                <Menu.Separator />
                <Menu.Item value="paste-range" onClick={handlePasteRange}>
                  <Box flex="1">Paste</Box>
                  <Kbd size="sm">⌘V</Kbd>
                </Menu.Item>
                <Menu.Item value="clear-range" onClick={handleClearRange}>
                  <Box flex="1">Clear</Box>
                  <Kbd size="sm">Del</Kbd>
                </Menu.Item>
              </>
            ) : (
              <>
                <Menu.Item value="copy-value" onClick={handleCopyValue}>
                  <Box flex="1">Copy value</Box>
                  <Kbd size="sm">⌘C</Kbd>
                </Menu.Item>
                <Menu.Item value="copy-json-path" onClick={handleCopyJsonPath}>
                  Copy JSON path
                </Menu.Item>
                <Menu.Separator />
                <Menu.Item
                  value="edit"
                  disabled={!cell.isEditable}
                  onPointerDown={onEditPointerDown}
                >
                  <Box flex="1">Edit</Box>
                  <Kbd size="sm">Enter</Kbd>
                </Menu.Item>
                <Menu.Separator />
                <Menu.Item
                  value="paste"
                  onClick={handlePaste}
                  disabled={cell.isReadOnly}
                >
                  <Box flex="1">Paste</Box>
                  <Kbd size="sm">⌘V</Kbd>
                </Menu.Item>
                <Menu.Item
                  value="clear"
                  onClick={handleClear}
                  disabled={cell.isReadOnly}
                >
                  Clear
                </Menu.Item>
              </>
            )}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    );
  },
);
