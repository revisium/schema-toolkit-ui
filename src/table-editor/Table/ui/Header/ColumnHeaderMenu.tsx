import { Menu, Text } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { LuCopy, LuFilter, LuPin, LuPinOff } from 'react-icons/lu';
import { PiEyeSlash, PiListBullets } from 'react-icons/pi';
import type { ColumnSpec } from '../../../Columns/model/types.js';
import type { ColumnsModel } from '../../../Columns/model/ColumnsModel.js';
import type { FilterModel } from '../../../Filters/model/FilterModel.js';
import type { SortModel } from '../../../Sortings/model/SortModel.js';
import { SortSubmenu } from './SortSubmenu.js';
import { MoveColumnSubmenu } from './MoveColumnSubmenu.js';
import { InsertColumnSubmenu } from './InsertColumnSubmenu.js';

interface ColumnHeaderMenuProps {
  column: ColumnSpec;
  columnsModel: ColumnsModel;
  sortModel?: SortModel;
  filterModel?: FilterModel;
  onCopyPath?: (path: string) => void;
  onClose?: () => void;
}

export const ColumnHeaderMenu = observer(
  ({
    column,
    columnsModel,
    sortModel,
    filterModel,
    onCopyPath,
    onClose,
  }: ColumnHeaderMenuProps) => {
    const canRemove = columnsModel.canRemoveColumn;
    const availableFields = columnsModel.availableFieldsToAdd;
    const hasAvailableFields = availableFields.length > 0;
    const canMove =
      columnsModel.canMoveLeft(column.field) ||
      columnsModel.canMoveRight(column.field);

    const isPinned = columnsModel.isPinned(column.field);
    const canPinLeft = columnsModel.canPinLeft(column.field);
    const canPinRight = columnsModel.canPinRight(column.field);

    const handleHide = () => {
      columnsModel.hideColumn(column.field);
    };

    const handleAddFilter = () => {
      if (filterModel) {
        filterModel.addConditionForField(column.field);
        filterModel.setOpen(true);
      }
    };

    const handleCopyPath = () => {
      if (onCopyPath) {
        onCopyPath(column.field);
      } else {
        navigator.clipboard.writeText(column.field).catch(() => {});
      }
    };

    const handleInsertBefore = (field: string) => {
      columnsModel.insertColumnBefore(column.field, field);
      onClose?.();
    };

    const handleInsertAfter = (field: string) => {
      columnsModel.insertColumnAfter(column.field, field);
      onClose?.();
    };

    const handlePinLeft = () => {
      columnsModel.pinLeft(column.field);
    };

    const handlePinRight = () => {
      columnsModel.pinRight(column.field);
    };

    const handleUnpin = () => {
      columnsModel.unpin(column.field);
    };

    return (
      <Menu.Content minW="180px">
        {sortModel && !column.hasFormula && (
          <>
            <SortSubmenu field={column.field} sortModel={sortModel} />
            <Menu.Separator />
          </>
        )}
        {filterModel && !column.hasFormula && (
          <>
            <Menu.Item value="add-filter" onClick={handleAddFilter}>
              <LuFilter />
              <Text>Add filter</Text>
            </Menu.Item>
            <Menu.Separator />
          </>
        )}
        {canMove && (
          <>
            <MoveColumnSubmenu
              field={column.field}
              columnsModel={columnsModel}
            />
            <Menu.Separator />
          </>
        )}
        {isPinned ? (
          <>
            <Menu.Item value="unpin" onClick={handleUnpin}>
              <LuPinOff />
              <Text>Unpin column</Text>
            </Menu.Item>
            <Menu.Separator />
          </>
        ) : (
          <>
            {canPinLeft && (
              <Menu.Item value="pin-left" onClick={handlePinLeft}>
                <LuPin />
                <Text>Pin to left</Text>
              </Menu.Item>
            )}
            {canPinRight && (
              <Menu.Item value="pin-right" onClick={handlePinRight}>
                <LuPin />
                <Text>Pin to right</Text>
              </Menu.Item>
            )}
            {(canPinLeft || canPinRight) && <Menu.Separator />}
          </>
        )}
        {hasAvailableFields && (
          <>
            <InsertColumnSubmenu
              label="Insert before"
              valuePrefix="before"
              availableFields={availableFields}
              onSelect={handleInsertBefore}
            />
            <InsertColumnSubmenu
              label="Insert after"
              valuePrefix="after"
              availableFields={availableFields}
              onSelect={handleInsertAfter}
            />
            <Menu.Separator />
          </>
        )}
        <Menu.Item value="hide" disabled={!canRemove} onClick={handleHide}>
          <PiEyeSlash />
          <Text>Hide column</Text>
        </Menu.Item>
        <Menu.Item
          value="hide-all"
          disabled={!canRemove}
          onClick={columnsModel.hideAll}
        >
          <PiListBullets />
          <Text>Hide all columns</Text>
        </Menu.Item>
        <Menu.Separator />
        <Menu.Item value="copy-path" onClick={handleCopyPath}>
          <LuCopy />
          <Text>Copy path</Text>
        </Menu.Item>
      </Menu.Content>
    );
  },
);
