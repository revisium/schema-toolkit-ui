import { FC } from 'react';
import { Menu, Text } from '@chakra-ui/react';
import { LuCopy, LuTrash2 } from 'react-icons/lu';
import { PiCheckSquare } from 'react-icons/pi';

export interface RowActionMenuItemsProps {
  rowId: string;
  testIdPrefix: string;
  onSelect?: (rowId: string) => void;
  onDuplicate?: (rowId: string) => void;
  onDelete?: (rowId: string) => void;
}

export const RowActionMenuItems: FC<RowActionMenuItemsProps> = ({
  rowId,
  testIdPrefix,
  onSelect,
  onDuplicate,
  onDelete,
}) => {
  return (
    <>
      {onSelect && (
        <Menu.Item
          value="select"
          onClick={() => onSelect(rowId)}
          data-testid={`${testIdPrefix}-select-${rowId}`}
        >
          <PiCheckSquare />
          <Text>Select</Text>
        </Menu.Item>
      )}
      {onDuplicate && (
        <Menu.Item
          value="duplicate"
          onClick={() => onDuplicate(rowId)}
          data-testid={`${testIdPrefix}-duplicate-${rowId}`}
        >
          <LuCopy />
          <Text>Duplicate</Text>
        </Menu.Item>
      )}
      {onDelete && (
        <>
          {(onSelect || onDuplicate) && <Menu.Separator />}
          <Menu.Item
            value="delete"
            onClick={() => onDelete(rowId)}
            data-testid={`${testIdPrefix}-delete-${rowId}`}
          >
            <LuTrash2 />
            <Text color="red.600">Delete</Text>
          </Menu.Item>
        </>
      )}
    </>
  );
};
