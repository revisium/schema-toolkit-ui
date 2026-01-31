import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import type { BaseNodeVM } from '../../vm/BaseNodeVM';
import { NodeIndicators } from '../NodeIndicators/NodeIndicators';
import { NodeContextMenu } from '../NodeContextMenu';

interface NodeRightContentProps {
  viewModel: BaseNodeVM;
  dataTestId: string;
  showDelete?: boolean;
  onDelete?: () => void;
}

export const NodeRightContent: FC<NodeRightContentProps> = observer(
  ({ viewModel, dataTestId, showDelete = true, onDelete }) => {
    return (
      <>
        <NodeIndicators viewModel={viewModel} />
        {viewModel.showMenu && (
          <NodeContextMenu
            viewModel={viewModel}
            dataTestId={`${dataTestId}-setting-button`}
            showDelete={showDelete}
            onDelete={onDelete}
          />
        )}
      </>
    );
  },
);
