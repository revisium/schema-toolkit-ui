import { Flex, IconButton, Menu, Portal, Text } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { PiListBullets, PiPlus } from 'react-icons/pi';
import type { ColumnsModel } from '../../../Columns/model/ColumnsModel.js';
import {
  groupFileFields,
  isFileFieldGroup,
} from '../../../Columns/model/groupFileFields.js';
import { FieldMenuItem } from './FieldMenuItem.js';
import { FileFieldSubmenu } from './FileFieldSubmenu.js';

interface AddColumnButtonProps {
  columnsModel: ColumnsModel;
}

export const AddColumnButton = observer(
  ({ columnsModel }: AddColumnButtonProps) => {
    const availableFields = columnsModel.availableFieldsToAdd;
    const availableSystemFields = columnsModel.availableSystemFieldsToAdd;
    const hasHidden = columnsModel.hasHiddenColumns;

    if (!hasHidden) {
      return null;
    }

    const groupedFields = groupFileFields(
      availableFields,
      columnsModel.allColumns,
    );

    return (
      <Flex alignItems="center" px="4px" height="100%">
        <Menu.Root
          positioning={{ placement: 'bottom-start' }}
          lazyMount
          unmountOnExit
        >
          <Menu.Trigger asChild>
            <IconButton
              aria-label="Add column"
              size="xs"
              variant="ghost"
              color="gray.400"
              _hover={{ bg: 'gray.100', color: 'gray.600' }}
              focusRing="none"
              data-testid="add-column-button"
            >
              <PiPlus />
            </IconButton>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content minW="200px" maxH="340px" overflowY="auto">
                <Menu.Item value="add-all" onClick={columnsModel.addAll}>
                  <PiListBullets />
                  <Text>Add all columns</Text>
                </Menu.Item>
                {groupedFields.length > 0 && (
                  <>
                    <Menu.Separator />
                    <Menu.ItemGroup>
                      <Menu.ItemGroupLabel
                        fontWeight="medium"
                        color="gray.500"
                        fontSize="xs"
                      >
                        Data fields
                      </Menu.ItemGroupLabel>
                      {groupedFields.map((item) =>
                        isFileFieldGroup(item) ? (
                          <FileFieldSubmenu
                            key={item.parent.field}
                            group={item}
                            parentVisible={item.parentVisible}
                            onClick={columnsModel.showColumn}
                          />
                        ) : (
                          <FieldMenuItem
                            key={item.field}
                            field={item.field}
                            name={item.label}
                            fieldType={item.fieldType}
                            onClick={columnsModel.showColumn}
                          />
                        ),
                      )}
                    </Menu.ItemGroup>
                  </>
                )}
                {availableSystemFields.length > 0 && (
                  <>
                    <Menu.Separator />
                    <Menu.ItemGroup>
                      <Menu.ItemGroupLabel
                        fontWeight="medium"
                        color="gray.500"
                        fontSize="xs"
                      >
                        System fields
                      </Menu.ItemGroupLabel>
                      {availableSystemFields.map((col) => (
                        <FieldMenuItem
                          key={col.field}
                          field={col.field}
                          name={col.label}
                          fieldType={col.fieldType}
                          onClick={columnsModel.showColumn}
                        />
                      ))}
                    </Menu.ItemGroup>
                  </>
                )}
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </Flex>
    );
  },
);
