import { Box, Flex, Text } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import type { NodeAccessor } from '../../../model/accessor';
import type { SchemaTreeVM } from '../../../model/vm';
import { TreeNodeWrapper } from '../TreeNodeWrapper';
import { TreeNodeIndicators } from '../TreeNodeIndicators';
import { TreeNodeContextMenu } from '../TreeNodeContextMenu';
import { TypeMenu } from '../../TypeMenu/TypeMenu';
import { ArrayItemsChildren } from './ArrayItemsChildren';

interface ArrayItemsViewProps {
  accessor: NodeAccessor;
  childAccessor: NodeAccessor;
  treeVM: SchemaTreeVM;
  dataTestId: string;
}

export const ArrayItemsView: FC<ArrayItemsViewProps> = observer(
  ({ accessor, childAccessor, treeVM, dataTestId }) => {
    const hoverTargetClass = childAccessor.hoverTargetClass;
    const applyHoverStyles = childAccessor.shouldApplyFieldStyles;

    const handleChangeItemsType = (typeId: string) => {
      accessor.actions.changeItemsType(typeId);
    };

    return (
      <TreeNodeWrapper
        accessor={childAccessor}
        isCollapsible={false}
        isCollapsed={false}
        hoverTargetClass={hoverTargetClass}
        field={
          <Flex gap="0.5rem" alignItems="center">
            <TypeMenu
              dataTestId={dataTestId}
              onSelect={handleChangeItemsType}
              open={childAccessor.state.isMenuOpen}
              onOpenChange={childAccessor.state.setMenuOpen}
              menuButton={
                <Text
                  data-testid={`${dataTestId}-select-type-button`}
                  color="gray.400"
                  cursor="pointer"
                  textDecoration="underline"
                  outline={0}
                >
                  {childAccessor.label.typeLabel}
                </Text>
              }
            />
            <Box
              className={applyHoverStyles ? hoverTargetClass : undefined}
              opacity={applyHoverStyles ? 0 : 1}
            >
              <Flex gap="0.5rem" alignItems="center">
                <TreeNodeIndicators accessor={childAccessor} />
                {childAccessor.showMenu && (
                  <TreeNodeContextMenu
                    accessor={childAccessor}
                    dataTestId={`${dataTestId}-items-setting-button`}
                    showDelete={false}
                    showFormula={childAccessor.isPrimitive}
                    showDefault={childAccessor.isPrimitive}
                  />
                )}
              </Flex>
            </Box>
          </Flex>
        }
      >
        <ArrayItemsChildren
          accessor={childAccessor}
          treeVM={treeVM}
          dataTestId={`${dataTestId}-0`}
        />
      </TreeNodeWrapper>
    );
  },
);
