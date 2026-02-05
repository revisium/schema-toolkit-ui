import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import type { NodeAccessor } from '../../../model/accessor';
import { TreeNodeIndicators } from '../TreeNodeIndicators';
import { TreeNodeContextMenu } from '../TreeNodeContextMenu';

interface TreeNodeRightContentProps {
  accessor: NodeAccessor;
  dataTestId: string;
  showDelete?: boolean;
  showFormula?: boolean;
  showDefault?: boolean;
  onDelete?: () => void;
}

export const TreeNodeRightContent: FC<TreeNodeRightContentProps> = observer(
  ({
    accessor,
    dataTestId,
    showDelete = true,
    showFormula = false,
    showDefault = false,
    onDelete,
  }) => {
    const showMenu = !accessor.isReadonly;

    return (
      <>
        <TreeNodeIndicators accessor={accessor} />
        {showMenu && (
          <TreeNodeContextMenu
            accessor={accessor}
            dataTestId={`${dataTestId}-setting-button`}
            showDelete={showDelete}
            showFormula={showFormula}
            showDefault={showDefault}
            onDelete={onDelete}
          />
        )}
      </>
    );
  },
);
