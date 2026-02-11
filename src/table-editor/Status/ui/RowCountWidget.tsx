import { observer } from 'mobx-react-lite';
import { Flex, Spinner, Text } from '@chakra-ui/react';
import type { RowCountModel } from '../model/RowCountModel.js';

interface RowCountWidgetProps {
  model: RowCountModel;
}

export const RowCountWidget = observer(({ model }: RowCountWidgetProps) => {
  return (
    <Flex alignItems="center" gap={2}>
      <Text fontSize="sm" color="gray.500" data-testid="row-count-text">
        {model.text}
      </Text>
      {model.isRefetching && (
        <Spinner size="xs" color="gray.400" data-testid="row-count-spinner" />
      )}
    </Flex>
  );
});
