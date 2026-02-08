import { FC, Fragment, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { VStack } from '@chakra-ui/react';
import type { NodeVM } from '../../vm/types';
import { NODE_RENDERERS } from '../renderers/NodeRenderers';
import { Row } from '../components/Row';
import { CreateButton } from '../../../components/CreateButton';

export interface NodeViewProps {
  viewModel: NodeVM;
}

export const NodeView: FC<NodeViewProps> = observer(({ viewModel }) => {
  const Renderer = NODE_RENDERERS[viewModel.rendererType];
  const { showChildren, childNodes } = viewModel;
  const showAddButton = viewModel.isArray() && viewModel.showAddButton;

  const handleAddItem = useCallback(() => {
    if (viewModel.isArray()) {
      viewModel.pushValue(null);
    }
  }, [viewModel]);

  return (
    <Fragment>
      <Renderer node={viewModel} />
      {showChildren && (
        <VStack align="stretch" gap={0}>
          {childNodes.map((child) => (
            <NodeView key={child.id} viewModel={child} />
          ))}
        </VStack>
      )}
      {showAddButton && (
        <Row
          name=""
          guides={[...viewModel.guides, false]}
          skipDot
          skipField
          skipMore
        >
          <CreateButton
            title="Item"
            onClick={handleAddItem}
            dataTestId={`${viewModel.testId}-add-button`}
          />
        </Row>
      )}
    </Fragment>
  );
});
