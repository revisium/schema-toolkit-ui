import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import type { PrimitiveNodeVM } from '../../vm/PrimitiveNodeVM';
import { NodeWrapper } from '../NodeWrapper/NodeWrapper';
import { FieldEditor } from '../FieldEditor/FieldEditor';
import { NodeIndicators } from '../NodeIndicators/NodeIndicators';
import { NodeSettings } from '../NodeSettings/NodeSettings';

interface PrimitiveNodeViewProps {
  viewModel: PrimitiveNodeVM;
  dataTestId: string;
}

export const PrimitiveNodeView: FC<PrimitiveNodeViewProps> = observer(
  ({ viewModel, dataTestId }) => {
    const hoverTargetClass = `hover-target-${viewModel.nodeId}`;

    const rightContent = (
      <>
        <NodeIndicators viewModel={viewModel} />
        {viewModel.showMenu && (
          <NodeSettings
            viewModel={viewModel}
            dataTestId={`${dataTestId}-setting-button`}
            showDelete
            showFormula
            showDefault
            onDelete={viewModel.removeSelf}
          />
        )}
      </>
    );

    return (
      <NodeWrapper
        viewModel={viewModel}
        isCollapsible={false}
        isCollapsed={false}
        hoverTargetClass={hoverTargetClass}
        field={
          <FieldEditor
            viewModel={viewModel}
            dataTestId={dataTestId}
            hoverTargetClass={hoverTargetClass}
            onChangeType={viewModel.changeType}
            rightContent={rightContent}
          />
        }
      />
    );
  },
);
