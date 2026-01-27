import { observer } from 'mobx-react-lite';
import { FC, ReactNode } from 'react';
import type { BaseNodeVM } from '../../vm/BaseNodeVM';
import { NodeWrapper } from '../NodeWrapper/NodeWrapper';
import { FieldEditor } from '../FieldEditor/FieldEditor';
import { NodeIndicators } from '../NodeIndicators/NodeIndicators';
import { NodeSettings } from '../NodeSettings/NodeSettings';

interface LeafNodeViewProps {
  viewModel: BaseNodeVM;
  dataTestId: string;
  children?: ReactNode;
}

export const LeafNodeView: FC<LeafNodeViewProps> = observer(
  ({ viewModel, dataTestId, children }) => {
    const hoverTargetClass = `hover-target-${viewModel.nodeId}`;

    const rightContent = (
      <>
        <NodeIndicators viewModel={viewModel} />
        {viewModel.showMenu && (
          <NodeSettings
            viewModel={viewModel}
            dataTestId={`${dataTestId}-setting-button`}
            showDelete
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
      >
        {children}
      </NodeWrapper>
    );
  },
);
