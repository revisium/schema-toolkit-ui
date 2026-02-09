import { FC } from 'react';
import { observer } from 'mobx-react-lite';
import type { FlatItem } from '../../vm/flattenNodes';
import { NODE_RENDERERS } from '../renderers/NodeRenderers';
import { Row } from '../components/Row';
import { CreateButton } from '../../../components/CreateButton';

export const FlatItemView: FC<{ item: FlatItem }> = observer(({ item }) => {
  if (item.type === 'node') {
    const Renderer = NODE_RENDERERS[item.node.rendererType];
    return <Renderer node={item.node} />;
  }

  const handleAddItem = () => {
    item.array.pushValue(null);
  };

  return (
    <Row name="" guides={item.guides} skipDot skipField skipMore>
      <CreateButton
        title="Item"
        onClick={handleAddItem}
        dataTestId={`${item.array.testId}-add-button`}
      />
    </Row>
  );
});
