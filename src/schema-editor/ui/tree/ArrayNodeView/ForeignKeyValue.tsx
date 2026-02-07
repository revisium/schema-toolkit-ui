import { Flex, Text } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import type { NodeAccessor } from '../../../model/accessor';

interface ForeignKeyValueProps {
  accessor: NodeAccessor;
  dataTestId: string;
}

export const ForeignKeyValue: FC<ForeignKeyValueProps> = observer(
  ({ accessor, dataTestId }) => {
    const value = accessor.label.foreignKeyTable;

    return (
      <Flex gap="4px" alignItems="center" height="30px" mt="2px" mb="2px">
        <Flex
          gap="0.5rem"
          width="100%"
          justifyContent="flex-start"
          outline={0}
          _hover={{
            textDecoration: 'underline',
            textDecorationColor: 'gray.400',
          }}
          onClick={accessor.actions.selectForeignKey}
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
