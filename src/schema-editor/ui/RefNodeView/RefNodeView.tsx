import { Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import type { RefNodeVM } from '../../vm/RefNodeVM';
import { LeafNodeView } from '../LeafNodeView/LeafNodeView';
import { NodeWrapper } from '../NodeWrapper/NodeWrapper';
import { FieldEditor } from '../FieldEditor/FieldEditor';
import { NodeIndicators } from '../NodeIndicators/NodeIndicators';
import { NodeContextMenu } from '../NodeContextMenu';
import { NodeView } from '../NodeView/NodeView';

interface RefNodeViewProps {
  viewModel: RefNodeVM;
  dataTestId: string;
}

export const RefNodeView: FC<RefNodeViewProps> = observer(
  ({ viewModel, dataTestId }) => {
    if (!viewModel.isCollapsible) {
      return <LeafNodeView viewModel={viewModel} dataTestId={dataTestId} />;
    }

    const hoverTargetClass = `hover-target-${viewModel.nodeId}`;

    const rightContent = (
      <>
        <NodeIndicators viewModel={viewModel} />
        {viewModel.showMenu && (
          <NodeContextMenu
            viewModel={viewModel}
            dataTestId={`${dataTestId}-setting-button`}
            showDelete={!viewModel.isRoot}
            onDelete={viewModel.removeSelf}
          />
        )}
      </>
    );

    return (
      <NodeWrapper
        viewModel={viewModel}
        isCollapsible={viewModel.isCollapsible}
        isCollapsed={viewModel.isCollapsed}
        onToggleCollapse={viewModel.toggleCollapsed}
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
        <Flex flexDirection="column" width="100%">
          {viewModel.children.map((childVm, index) => (
            <NodeView
              key={childVm.nodeId}
              viewModel={childVm}
              dataTestId={`${dataTestId}-${index}`}
            />
          ))}
        </Flex>
      </NodeWrapper>
    );
  },
);
