import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import type { RefNodeVM } from '../../vm/RefNodeVM';
import { LeafNodeView } from '../LeafNodeView/LeafNodeView';

interface RefNodeViewProps {
  viewModel: RefNodeVM;
  dataTestId: string;
}

export const RefNodeView: FC<RefNodeViewProps> = observer(
  ({ viewModel, dataTestId }) => {
    return <LeafNodeView viewModel={viewModel} dataTestId={dataTestId} />;
  },
);
