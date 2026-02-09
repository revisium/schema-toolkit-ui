import { FC, ReactNode, useState, useCallback } from 'react';
import { FocusPopover } from './FocusPopover';
import { SearchForeignKey } from '../../../search-foreign-key';
import type { ForeignKeyNodeVM } from '../../vm/types';

interface ForeignKeyMenuProps {
  node: ForeignKeyNodeVM;
  onSelect: (id: string) => void;
  disabled?: boolean;
  children: ReactNode;
}

export const ForeignKeyMenu: FC<ForeignKeyMenuProps> = ({
  node,
  onSelect,
  disabled,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const onSearchForeignKey = node.callbacks?.onSearchForeignKey;

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
      setIsOpen(false);
    },
    [onSelect],
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleOpenTableSearch = useCallback(async () => {
    if (!node.callbacks?.onOpenTableSearch) {
      return;
    }
    const selectedId = await node.callbacks.onOpenTableSearch(
      node.foreignKeyTableId,
    );
    if (selectedId) {
      handleSelect(selectedId);
    }
  }, [node.callbacks, node.foreignKeyTableId, handleSelect]);

  const handleCreateAndConnect = useCallback(async () => {
    if (!node.callbacks?.onCreateAndConnect) {
      return;
    }
    const createdId = await node.callbacks.onCreateAndConnect(
      node.foreignKeyTableId,
    );
    if (createdId) {
      handleSelect(createdId);
    }
  }, [node.callbacks, node.foreignKeyTableId, handleSelect]);

  if (!onSearchForeignKey) {
    return <>{children}</>;
  }

  return (
    <FocusPopover
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      trigger={children}
      disabled={disabled}
      width="320px"
    >
      <SearchForeignKey
        tableId={node.foreignKeyTableId}
        onSearch={onSearchForeignKey}
        onSelect={handleSelect}
        onClose={handleClose}
        onOpenTableSearch={
          node.callbacks?.onOpenTableSearch ? handleOpenTableSearch : undefined
        }
        onCreateAndConnect={
          node.callbacks?.onCreateAndConnect
            ? handleCreateAndConnect
            : undefined
        }
      />
    </FocusPopover>
  );
};
