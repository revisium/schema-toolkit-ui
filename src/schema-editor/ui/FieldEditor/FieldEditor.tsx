import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC, ReactNode } from 'react';
import { PiDotsSixVerticalBold, PiWarningCircle } from 'react-icons/pi';
import { Tooltip } from '../../../components/Tooltip';
import { ContentEditable } from '../../../components/ContentEditable';
import type { BaseNodeVM } from '../../vm/BaseNodeVM';
import { TypeMenu } from '../TypeMenu/TypeMenu';
import { useDragAndDrop } from '../hooks/useDragAndDrop';

interface FieldEditorProps {
  viewModel: BaseNodeVM;
  dataTestId: string;
  hoverTargetClass?: string;
  onChangeType: (typeId: string) => void;
  rightContent?: ReactNode;
}

export const FieldEditor: FC<FieldEditorProps> = observer(
  ({ viewModel, dataTestId, hoverTargetClass, onChangeType, rightContent }) => {
    const applyHoverStyles = viewModel.shouldApplyFieldStyles;
    const hoverClass =
      applyHoverStyles && hoverTargetClass ? hoverTargetClass : undefined;
    const hasName = Boolean(viewModel.name);
    const showTypeAndMenu = hasName || viewModel.isRoot;

    const {
      dragAndDropRef,
      isDraggable,
      isDrop,
      isDraggedOver,
      isDisabledDrop,
    } = useDragAndDrop({ viewModel });

    return (
      <Flex gap="0.5rem" width="100%" justifyContent="flex-start" outline={0}>
        <Flex
          data-testid={isDrop ? `${dataTestId}-drop` : undefined}
          ref={dragAndDropRef}
          flex={!hasName ? 1 : 0}
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
          <ContentEditable
            dataTestId={dataTestId}
            autoFocus={!viewModel.name}
            initValue={viewModel.name}
            placeholder={
              viewModel.isRoot
                ? 'Enter the name of the table'
                : 'Enter the name of the field'
            }
            onBlur={viewModel.handleFieldBlur}
            onFocus={() => viewModel.setFocused(true)}
            onChange={viewModel.rename}
          />
          {hasName && viewModel.hasError && (
            <Tooltip
              content={viewModel.errorMessage ?? ''}
              positioning={{ placement: 'top' }}
              contentProps={{ maxWidth: '400px' }}
            >
              <Box
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
          <Box className={hoverClass} opacity={applyHoverStyles ? 0 : 1}>
            <Flex gap="0.5rem" alignItems="center">
              {viewModel.showTypeSelector && (
                <TypeMenu
                  dataTestId={dataTestId}
                  onSelect={onChangeType}
                  open={viewModel.isMenuOpen}
                  onOpenChange={viewModel.setMenuOpen}
                  menuButton={
                    <Text
                      data-testid={`${dataTestId}-select-type-button`}
                      color="gray.400"
                      textDecoration="underline"
                      cursor="pointer"
                    >
                      {viewModel.label}
                    </Text>
                  }
                />
              )}
              {rightContent}
            </Flex>
          </Box>
        )}
      </Flex>
    );
  },
);
