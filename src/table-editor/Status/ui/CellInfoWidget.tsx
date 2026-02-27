import { observer } from 'mobx-react-lite';
import { Flex, Text } from '@chakra-ui/react';
import type { CellInfoModel } from '../model/CellInfoModel.js';

interface CellInfoWidgetProps {
  model: CellInfoModel;
}

export const CellInfoWidget = observer(({ model }: CellInfoWidgetProps) => {
  if (!model.isVisible) {
    return null;
  }

  return (
    <Flex alignItems="center" gap={2} overflow="hidden" flexShrink={1} minW={0}>
      <Text
        fontSize="sm"
        color="gray.500"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        data-testid="cell-info-field"
      >
        {model.fieldLabel}
      </Text>
      {model.formulaExpression && (
        <Text
          fontSize="sm"
          color="purple.400"
          fontFamily="mono"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          data-testid="cell-info-formula"
        >
          = {model.formulaExpression}
        </Text>
      )}
      {model.foreignKeyTableId && !model.formulaExpression && (
        <Text
          fontSize="sm"
          color="blue.400"
          fontFamily="mono"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          data-testid="cell-info-fk"
        >
          → {model.foreignKeyTableId}
        </Text>
      )}
    </Flex>
  );
});
