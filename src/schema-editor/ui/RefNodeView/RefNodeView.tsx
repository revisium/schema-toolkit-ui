import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import type { RefNodeVM } from '../../vm/RefNodeVM';
import { LeafNodeView } from '../LeafNodeView/LeafNodeView';
import { CollapsibleNodeView } from '../CollapsibleNodeView';

interface RefNodeViewProps {
  viewModel: RefNodeVM;
  dataTestId: string;
}

export const RefNodeView: FC<RefNodeViewProps> = observer(
  ({ viewModel, dataTestId }) => {
    if (!viewModel.isCollapsible) {
      return <LeafNodeView viewModel={viewModel} dataTestId={dataTestId} />;
    }

    return (
      <CollapsibleNodeView viewModel={viewModel} dataTestId={dataTestId} />
    );
  },
);
