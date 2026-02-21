import { observer } from 'mobx-react-lite';
import { ActionBar, Button, Portal } from '@chakra-ui/react';
import { LuCopy, LuTrash2 } from 'react-icons/lu';
import { PiCheckSquare, PiX } from 'react-icons/pi';
import type { SelectionModel } from '../model/SelectionModel.js';

interface SelectionToolbarProps {
  selection: SelectionModel;
  allRowIds: string[];
  onDuplicate?: (ids: string[]) => void;
  onDelete?: (ids: string[]) => void;
}

export const SelectionToolbar = observer(
  ({ selection, allRowIds, onDuplicate, onDelete }: SelectionToolbarProps) => {
    const isAllSelected = selection.isAllSelected(allRowIds);

    return (
      <ActionBar.Root open={selection.isSelectionMode}>
        <Portal>
          <ActionBar.Positioner>
            <ActionBar.Content data-testid="selection-toolbar">
              <ActionBar.SelectionTrigger>
                {selection.selectedCount} selected
              </ActionBar.SelectionTrigger>
              <ActionBar.Separator />
              {!isAllSelected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selection.selectAll(allRowIds)}
                  data-testid="select-all"
                >
                  <PiCheckSquare />
                  Select all
                </Button>
              )}
              {onDuplicate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDuplicate(selection.selectedIds)}
                  data-testid="duplicate-selected"
                >
                  <LuCopy />
                  Duplicate
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(selection.selectedIds)}
                  data-testid="delete-selected"
                >
                  <LuTrash2 />
                  Delete
                </Button>
              )}
              <ActionBar.CloseTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Exit selection"
                  onClick={() => selection.exitSelectionMode()}
                  data-testid="exit-selection"
                >
                  <PiX />
                </Button>
              </ActionBar.CloseTrigger>
            </ActionBar.Content>
          </ActionBar.Positioner>
        </Portal>
      </ActionBar.Root>
    );
  },
);
