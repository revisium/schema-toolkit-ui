import { Box, Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { CreateButton } from '../../../components';
import type { ObjectNodeVM } from '../../vm/ObjectNodeVM';
import { NodeWrapper } from '../NodeWrapper/NodeWrapper';
import { FieldEditor } from '../FieldEditor/FieldEditor';
import { NodeIndicators } from '../NodeIndicators/NodeIndicators';
import { NodeContextMenu } from '../NodeContextMenu';
import { NodeView } from '../NodeView/NodeView';

interface ObjectNodeViewProps {
  viewModel: ObjectNodeVM;
  dataTestId: string;
}

export const ObjectNodeView: FC<ObjectNodeViewProps> = observer(
  ({ viewModel, dataTestId }) => {
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
          {viewModel.showAddButton && (
            <Box ml="-14px">
              <CreateButton
                dataTestId={`${dataTestId}-create-field-button`}
                title="Field"
                onClick={() => viewModel.addProperty('')}
              />
            </Box>
          )}
        </Flex>
      </NodeWrapper>
    );
  },
);
