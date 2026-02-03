import { Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC, ReactNode } from 'react';
import type { BaseNodeVM } from '../../vm/node/BaseNodeVM';
import type { NodeVM } from '../../vm/createNodeVM';
import { NodeWrapper } from '../NodeWrapper/NodeWrapper';
import { FieldEditor } from '../FieldEditor/FieldEditor';
import { NodeRightContent } from '../NodeRightContent';
import { NodeView } from '../NodeView/NodeView';

interface CollapsibleNodeViewProps {
  viewModel: BaseNodeVM & {
    isCollapsible: boolean;
    isCollapsed: boolean;
    toggleCollapsed: () => void;
    children: readonly NodeVM[];
  };
  dataTestId: string;
  footer?: ReactNode;
}

export const CollapsibleNodeView: FC<CollapsibleNodeViewProps> = observer(
  ({ viewModel, dataTestId, footer }) => {
    const hoverTargetClass = `hover-target-${viewModel.nodeId}`;

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
            rightContent={
              <NodeRightContent
                viewModel={viewModel}
                dataTestId={dataTestId}
                showDelete={!viewModel.isRoot}
                onDelete={viewModel.removeSelf}
              />
            }
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
          {footer}
        </Flex>
      </NodeWrapper>
    );
  },
);
