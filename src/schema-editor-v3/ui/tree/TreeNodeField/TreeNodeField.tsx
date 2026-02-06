import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC, ReactNode, useCallback } from 'react';
import { PiDotsSixVerticalBold, PiWarningCircle } from 'react-icons/pi';
import { Tooltip } from '../../../../components/Tooltip';
import { ContentEditable } from '../../../../components/ContentEditable';
import type { NodeAccessor } from '../../../model/accessor';
import type { SchemaTreeVM } from '../../../model/vm';
import { TypeMenu } from '../../TypeMenu/TypeMenu';
import { useDragAndDrop } from './useDragAndDrop';

interface TreeNodeFieldProps {
  accessor: NodeAccessor;
  treeVM: SchemaTreeVM;
  dataTestId: string;
  hoverTargetClass?: string;
  onChangeType: (typeId: string) => void;
  rightContent?: ReactNode;
}

export const TreeNodeField: FC<TreeNodeFieldProps> = observer(
  ({
    accessor,
    treeVM,
    dataTestId,
    hoverTargetClass,
    onChangeType,
    rightContent,
  }) => {
    const isActiveWithName =
      accessor.state.isActive && Boolean(accessor.label.name);
    const applyHoverStyles = !accessor.state.isFocused && !isActiveWithName;
    const hoverClass =
      applyHoverStyles && hoverTargetClass ? hoverTargetClass : undefined;
    const hasName = Boolean(accessor.label.name);
    const showTypeAndMenu = hasName || accessor.isRoot;

    const hasDropTarget = treeVM.schemaModel.hasValidDropTarget(
      accessor.nodeId,
    );
    const canDrag =
      !accessor.isRoot && !accessor.isReadonly && hasName && hasDropTarget;
    const isDropTarget = accessor.isObject && !accessor.isReadonly;

    const canAcceptDrop = useCallback(
      (fromNodeId: string) => {
        return treeVM.schemaModel.canMoveNode(fromNodeId, accessor.nodeId);
      },
      [accessor.nodeId, treeVM.schemaModel],
    );

    const handleDrop = useCallback(
      (fromNodeId: string) => {
        treeVM.moveNode(fromNodeId, accessor.nodeId);
      },
      [treeVM, accessor.nodeId],
    );

    const {
      dragAndDropRef,
      isDraggable,
      isDrop,
      isDraggedOver,
      isDisabledDrop,
    } = useDragAndDrop({
      accessor,
      canDrag,
      isDropTarget,
      canAcceptDrop,
      onDrop: handleDrop,
    });

    const showTypeSelector = !accessor.isReadonly;

    return (
      <Flex gap="0.5rem" width="100%" justifyContent="flex-start" outline={0}>
        <Flex
          data-testid={isDrop ? `${dataTestId}-drop` : undefined}
          ref={dragAndDropRef}
          flex={hasName ? 0 : 1}
          position="relative"
          whiteSpace="nowrap"
          borderWidth={1}
          borderStyle="dashed"
          borderColor={isDrop ? 'gray.400' : 'transparent'}
          backgroundColor={isDraggedOver ? 'gray.200' : undefined}
          color={isDisabledDrop ? 'gray.300' : undefined}
        >
          {isDraggable && (
            <Tooltip
              content="Drag to move field to another object"
              positioning={{ placement: 'left' }}
            >
              <Flex
                data-testid={`${dataTestId}-drag-button`}
                className={hoverClass}
                position="absolute"
                left="-34px"
                opacity={applyHoverStyles ? 0 : 1}
                cursor="grab"
                _hover={{ backgroundColor: 'gray.50' }}
                height="100%"
                alignItems="center"
                justifyContent="center"
                borderRadius="4px"
                marginLeft="-6px"
              >
                <Icon size="md" color="gray.300">
                  <PiDotsSixVerticalBold />
                </Icon>
              </Flex>
            </Tooltip>
          )}
          {accessor.isReadonly ? (
            <Text color="gray.400" data-testid={dataTestId}>
              {accessor.label.name}
            </Text>
          ) : (
            <ContentEditable
              dataTestId={dataTestId}
              autoFocus={!accessor.label.name}
              initValue={accessor.label.name}
              placeholder={
                accessor.isRoot
                  ? 'Enter the name of the table'
                  : 'Enter the name of the field'
              }
              onBlur={accessor.handleFieldBlur}
              onFocus={() => accessor.state.setFocused(true)}
              onChange={accessor.actions.rename}
              onEnter={treeVM.keyboard.handleEditEnter}
              focusIfDependencyList={[accessor.state.focusRequestCount]}
            />
          )}
          {hasName && accessor.validation.hasError && (
            <Tooltip
              content={accessor.validation.errorMessage ?? ''}
              positioning={{ placement: 'top' }}
              contentProps={{ maxWidth: '400px' }}
            >
              <Box
                data-testid={`${dataTestId}-error-indicator`}
                color="red.500"
                cursor="default"
                display="flex"
                alignItems="center"
                ml="4px"
              >
                <PiWarningCircle />
              </Box>
            </Tooltip>
          )}
        </Flex>
        {showTypeAndMenu && (
          <Flex gap="0.5rem" alignItems="center">
            <Box className={hoverClass} opacity={applyHoverStyles ? 0 : 1}>
              <Flex gap="0.5rem" alignItems="center">
                {showTypeSelector ? (
                  <TypeMenu
                    dataTestId={dataTestId}
                    onSelect={onChangeType}
                    open={accessor.state.isMenuOpen}
                    onOpenChange={accessor.state.setMenuOpen}
                    menuButton={
                      <Text
                        data-testid={`${dataTestId}-select-type-button`}
                        color="gray.400"
                        textDecoration="underline"
                        cursor="pointer"
                      >
                        {accessor.label.typeLabel}
                      </Text>
                    }
                  />
                ) : (
                  <Text
                    data-testid={`${dataTestId}-type-label`}
                    color="gray.400"
                  >
                    {accessor.label.typeLabel}
                  </Text>
                )}
                {rightContent}
              </Flex>
            </Box>
          </Flex>
        )}
      </Flex>
    );
  },
);
