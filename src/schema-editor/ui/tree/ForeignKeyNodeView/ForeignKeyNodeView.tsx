import { Box, Flex, Text } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC, useCallback } from 'react';
import { PiDotOutlineFill } from 'react-icons/pi';
import type { NodeAccessor } from '../../../model/accessor';
import type { SchemaTreeVM } from '../../../model/vm';
import { TreeNodeWrapper } from '../TreeNodeWrapper';
import { TreeNodeField } from '../TreeNodeField';
import { TreeNodeRightContent } from '../TreeNodeRightContent';

interface ForeignKeyNodeViewProps {
  accessor: NodeAccessor;
  treeVM: SchemaTreeVM;
  dataTestId: string;
}

export const ForeignKeyNodeView: FC<ForeignKeyNodeViewProps> = observer(
  ({ accessor, treeVM, dataTestId }) => {
    const hoverTargetClass = accessor.hoverTargetClass;

    const handleSelectForeignKey = useCallback(async () => {
      const tableId = await treeVM.selectForeignKey();
      if (tableId !== null) {
        accessor.actions.setForeignKey(tableId);
      }
    }, [treeVM, accessor.actions]);

    const foreignKeyValue = accessor.label.foreignKeyTable;

    return (
      <TreeNodeWrapper
        accessor={accessor}
        isCollapsible={false}
        isCollapsed={false}
        hoverTargetClass={hoverTargetClass}
        field={
          <TreeNodeField
            accessor={accessor}
            treeVM={treeVM}
            dataTestId={dataTestId}
            hoverTargetClass={hoverTargetClass}
            onChangeType={(typeId) => treeVM.changeNodeType(accessor, typeId)}
            rightContent={
              <TreeNodeRightContent
                accessor={accessor}
                dataTestId={dataTestId}
                showDelete={!accessor.isRoot}
                onDelete={accessor.actions.remove}
              />
            }
          />
        }
      >
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
            onClick={handleSelectForeignKey}
            cursor="pointer"
          >
            <Text
              color="gray.400"
              data-testid={`${dataTestId}-connect-foreign-key`}
            >
              {foreignKeyValue || '<Connect table>'}
            </Text>
          </Flex>
        </Flex>
      </TreeNodeWrapper>
    );
  },
);
