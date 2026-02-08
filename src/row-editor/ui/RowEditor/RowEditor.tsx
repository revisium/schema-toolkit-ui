import { FC } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, VStack } from '@chakra-ui/react';
import type { RowEditorVM } from '../../vm/RowEditorVM';
import { NodeView } from '../NodeView/NodeView';

export interface RowEditorProps {
  viewModel: RowEditorVM;
}

export const RowEditor: FC<RowEditorProps> = observer(({ viewModel }) => {
  const root = viewModel.root;

  if (root.isObject()) {
    return (
      <Box>
        <VStack align="stretch" gap={0}>
          {root.children.map((child) => (
            <NodeView key={child.id} viewModel={child} />
          ))}
        </VStack>
      </Box>
    );
  }

  return (
    <Box>
      <VStack align="stretch" gap={0}>
        <NodeView viewModel={root} />
      </VStack>
    </Box>
  );
});
