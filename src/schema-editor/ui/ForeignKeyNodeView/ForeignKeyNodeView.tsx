import { Box, Flex, Text } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { PiDotOutlineFill } from 'react-icons/pi';
import type { ForeignKeyNodeVM } from '../../vm/ForeignKeyNodeVM';
import { LeafNodeView } from '../LeafNodeView/LeafNodeView';

interface ForeignKeyNodeViewProps {
  viewModel: ForeignKeyNodeVM;
  dataTestId: string;
}

export const ForeignKeyNodeView: FC<ForeignKeyNodeViewProps> = observer(
  ({ viewModel, dataTestId }) => {
    return (
      <LeafNodeView viewModel={viewModel} dataTestId={dataTestId}>
        <ForeignKeyValue viewModel={viewModel} dataTestId={dataTestId} />
      </LeafNodeView>
    );
  },
);

interface ForeignKeyValueProps {
  viewModel: ForeignKeyNodeVM;
  dataTestId: string;
}

const ForeignKeyValue: FC<ForeignKeyValueProps> = observer(
  ({ viewModel, dataTestId }) => {
    const value = viewModel.foreignKeyValue;

    return (
      <Flex gap="4px" alignItems="center" height="30px" mt="2px" mb="2px">
        <Box color="gray.300">
          <PiDotOutlineFill />
        </Box>
        <Flex
          gap="0.5rem"
          width="100%"
          justifyContent="flex-start"
          outline={0}
          _hover={{
            textDecoration: 'underline',
            textDecorationColor: 'gray.400',
          }}
          onClick={viewModel.selectForeignKey}
          cursor="pointer"
        >
          <Text
            color="gray.400"
            data-testid={`${dataTestId}-connect-foreign-key`}
          >
            {value || '<Connect table>'}
          </Text>
        </Flex>
      </Flex>
    );
  },
);
