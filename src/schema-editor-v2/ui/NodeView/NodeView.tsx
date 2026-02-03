import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import type { NodeVM } from '../../vm/createNodeVM';
import { ObjectNodeVM } from '../../vm/node/ObjectNodeVM';
import { ArrayNodeVM } from '../../vm/node/ArrayNodeVM';
import { PrimitiveNodeVM } from '../../vm/node/PrimitiveNodeVM';
import { ForeignKeyNodeVM } from '../../vm/node/ForeignKeyNodeVM';
import { RefNodeVM } from '../../vm/node/RefNodeVM';
import { ObjectNodeView } from '../ObjectNodeView/ObjectNodeView';
import { ArrayNodeView } from '../ArrayNodeView/ArrayNodeView';
import { PrimitiveNodeView } from '../PrimitiveNodeView/PrimitiveNodeView';
import { ForeignKeyNodeView } from '../ForeignKeyNodeView/ForeignKeyNodeView';
import { RefNodeView } from '../RefNodeView/RefNodeView';

interface NodeViewProps {
  viewModel: NodeVM;
  dataTestId: string;
}

export const NodeView: FC<NodeViewProps> = observer(
  ({ viewModel, dataTestId }) => {
    if (viewModel instanceof ObjectNodeVM) {
      return <ObjectNodeView viewModel={viewModel} dataTestId={dataTestId} />;
    }

    if (viewModel instanceof ArrayNodeVM) {
      return <ArrayNodeView viewModel={viewModel} dataTestId={dataTestId} />;
    }

    if (viewModel instanceof ForeignKeyNodeVM) {
      return (
        <ForeignKeyNodeView viewModel={viewModel} dataTestId={dataTestId} />
      );
    }

    if (viewModel instanceof RefNodeVM) {
      return <RefNodeView viewModel={viewModel} dataTestId={dataTestId} />;
    }

    if (viewModel instanceof PrimitiveNodeVM) {
      return (
        <PrimitiveNodeView viewModel={viewModel} dataTestId={dataTestId} />
      );
    }

    return null;
  },
);
