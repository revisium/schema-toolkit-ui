import { Box, Flex, Text } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { PiDotOutlineFill } from 'react-icons/pi';
import { CreateButton } from '../../../components';
import type { ArrayNodeVM } from '../../vm/ArrayNodeVM';
import type { NodeVM } from '../../vm/createNodeVM';
import { ObjectNodeVM } from '../../vm/ObjectNodeVM';
import { ForeignKeyNodeVM } from '../../vm/ForeignKeyNodeVM';
import { NodeWrapper } from '../NodeWrapper/NodeWrapper';
import { FieldEditor } from '../FieldEditor/FieldEditor';
import { NodeIndicators } from '../NodeIndicators/NodeIndicators';
import { NodeSettings } from '../NodeSettings/NodeSettings';
import { TypeMenu } from '../TypeMenu/TypeMenu';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { NodeView } from '../NodeView/NodeView';

interface ArrayNodeViewProps {
  viewModel: ArrayNodeVM;
  dataTestId: string;
}

export const ArrayNodeView: FC<ArrayNodeViewProps> = observer(
  ({ viewModel, dataTestId }) => {
    const hoverTargetClass = `hover-target-${viewModel.nodeId}`;

    const rightContent = (
      <>
        <NodeIndicators viewModel={viewModel} />
        {viewModel.showMenu && (
          <NodeSettings
            viewModel={viewModel}
            dataTestId={`${dataTestId}-setting-button`}
            showDelete
            onDelete={viewModel.removeSelf}
          />
        )}
      </>
    );

    return (
      <NodeWrapper
        viewModel={viewModel}
        isCollapsible={viewModel.isCollapsible}
        isCollapsed={viewModel.isCollapsed}
        onToggleCollapse={viewModel.toggleCollapsed}
        hoverTargetClass={hoverTargetClass}
        field={
          <FieldEditor
            viewModel={viewModel}
            dataTestId={dataTestId}
            hoverTargetClass={hoverTargetClass}
            onChangeType={viewModel.changeType}
            rightContent={rightContent}
          />
        }
      >
        {viewModel.itemsVM && (
          <Flex flexDirection="column" width="100%">
            <ArrayItemsView viewModel={viewModel} dataTestId={dataTestId} />
          </Flex>
        )}
      </NodeWrapper>
    );
  },
);

interface ArrayItemsViewProps {
  viewModel: ArrayNodeVM;
  dataTestId: string;
}

const ArrayItemsView: FC<ArrayItemsViewProps> = observer(
  ({ viewModel, dataTestId }) => {
    const itemsVm = viewModel.itemsVM;
    if (!itemsVm) {
      return null;
    }

    const hoverTargetClass = `hover-target-${itemsVm.nodeId}`;
    const applyHoverStyles = itemsVm.shouldApplyFieldStyles;

    return (
      <NodeWrapper
        viewModel={itemsVm}
        isCollapsible={false}
        isCollapsed={false}
        hoverTargetClass={hoverTargetClass}
        field={
          <ArrayItemsField
            viewModel={viewModel}
            dataTestId={dataTestId}
            hoverTargetClass={hoverTargetClass}
            applyHoverStyles={applyHoverStyles}
          />
        }
      >
        <ArrayItemsChildren itemsVm={itemsVm} dataTestId={`${dataTestId}-0`} />
      </NodeWrapper>
    );
  },
);

interface ArrayItemsFieldProps {
  viewModel: ArrayNodeVM;
  dataTestId: string;
  hoverTargetClass: string;
  applyHoverStyles: boolean;
}

interface ArrayItemsChildrenProps {
  itemsVm: NodeVM;
  dataTestId: string;
}

const ArrayItemsChildren: FC<ArrayItemsChildrenProps> = observer(
  ({ itemsVm, dataTestId }) => {
    if (itemsVm instanceof ObjectNodeVM) {
      return (
        <Flex flexDirection="column" width="100%">
          {itemsVm.children.map((childVm, index) => (
            <NodeView
              key={childVm.nodeId}
              viewModel={childVm}
              dataTestId={`${dataTestId}-${index}`}
            />
          ))}
          {itemsVm.showAddButton && (
            <Box ml="-14px">
              <CreateButton
                dataTestId={`${dataTestId}-create-field-button`}
                title="Field"
                onClick={() => itemsVm.addProperty('')}
              />
            </Box>
          )}
        </Flex>
      );
    }

    if (itemsVm instanceof ForeignKeyNodeVM) {
      return <ForeignKeyValue viewModel={itemsVm} dataTestId={dataTestId} />;
    }

    return null;
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

const ArrayItemsField: FC<ArrayItemsFieldProps> = observer(
  ({ viewModel, dataTestId, hoverTargetClass, applyHoverStyles }) => {
    const itemsVm = viewModel.itemsVM;
    if (!itemsVm) {
      return null;
    }

    const { dragAndDropRef, isDrop, isDraggedOver, isDisabledDrop } =
      useDragAndDrop({ viewModel: itemsVm });

    return (
      <Flex
        ref={dragAndDropRef}
        data-testid={isDrop ? `${dataTestId}-items-drop` : undefined}
        borderWidth={1}
        borderStyle="dashed"
        borderColor={isDrop ? 'gray.400' : 'transparent'}
        backgroundColor={isDraggedOver ? 'gray.200' : undefined}
        color={isDisabledDrop ? 'gray.300' : undefined}
        gap="0.5rem"
        alignItems="center"
      >
        <TypeMenu
          dataTestId={dataTestId}
          onSelect={viewModel.changeItemsType}
          open={itemsVm.isMenuOpen}
          onOpenChange={itemsVm.setMenuOpen}
          menuButton={
            <Text
              data-testid={`${dataTestId}-select-type-button`}
              color="gray.400"
              cursor="pointer"
              textDecoration="underline"
              outline={0}
            >
              {itemsVm.label}
            </Text>
          }
        />
        <Box
          className={applyHoverStyles ? hoverTargetClass : undefined}
          opacity={applyHoverStyles ? 0 : 1}
        >
          <Flex gap="0.5rem" alignItems="center">
            <NodeIndicators viewModel={itemsVm} />
            {itemsVm.showMenu && (
              <NodeSettings
                viewModel={itemsVm}
                dataTestId={`${dataTestId}-items-setting-button`}
                showDelete={false}
              />
            )}
          </Flex>
        </Box>
      </Flex>
    );
  },
);
