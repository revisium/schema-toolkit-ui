import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import type { NodeAccessor } from '../../../model/accessor';
import type { SchemaTreeVM } from '../../../model/vm';
import { NodeViewLayout } from '../NodeViewLayout';

interface PrimitiveNodeViewProps {
  accessor: NodeAccessor;
  treeVM: SchemaTreeVM;
  dataTestId: string;
}

export const PrimitiveNodeView: FC<PrimitiveNodeViewProps> = observer(
  ({ accessor, treeVM, dataTestId }) => {
    return (
      <NodeViewLayout
        accessor={accessor}
        treeVM={treeVM}
        dataTestId={dataTestId}
        showFormula={accessor.isPrimitive}
        showDefault={accessor.isPrimitive}
      />
    );
  },
);
