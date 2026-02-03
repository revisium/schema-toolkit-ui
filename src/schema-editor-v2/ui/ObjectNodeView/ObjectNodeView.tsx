import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { CreateButton } from '../../../components';
import type { ObjectNodeVM } from '../../vm/node/ObjectNodeVM';
import { CollapsibleNodeView } from '../CollapsibleNodeView';

interface ObjectNodeViewProps {
  viewModel: ObjectNodeVM;
  dataTestId: string;
}

export const ObjectNodeView: FC<ObjectNodeViewProps> = observer(
  ({ viewModel, dataTestId }) => {
    return (
      <CollapsibleNodeView
        viewModel={viewModel}
        dataTestId={dataTestId}
        footer={
          viewModel.showAddButton && (
            <Box ml="-14px">
              <CreateButton
                dataTestId={`${dataTestId}-create-field-button`}
                title="Field"
                onClick={() => viewModel.addProperty('')}
              />
            </Box>
          )
        }
      />
    );
  },
);
