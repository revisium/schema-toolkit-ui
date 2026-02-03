import { Box, Portal } from '@chakra-ui/react';
import { Menu } from '@chakra-ui/react/menu';
import { FC, Fragment, ReactElement } from 'react';
import { LuChevronRight } from 'react-icons/lu';
import { typeMenuGroups, type MenuOptionItem } from '../../config/index';

interface SubMenuProps {
  label: string;
  options: MenuOptionItem[];
  onSelect: (id: string) => void;
  dataTestIdPrefix?: string;
}

const SubMenu: FC<SubMenuProps> = ({
  label,
  options,
  onSelect,
  dataTestIdPrefix,
}) => {
  return (
    <Menu.Root positioning={{ placement: 'right-start', gutter: 2 }}>
      <Menu.TriggerItem>
        <Box flex="1">{label}</Box>
        <LuChevronRight />
      </Menu.TriggerItem>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {options.map((option) => (
              <Fragment key={option.id}>
                <Menu.Item
                  value={option.id}
                  data-testid={`${dataTestIdPrefix}-${option.id}`}
                  onClick={() => onSelect(option.id)}
                >
                  {option.label}
                </Menu.Item>
                {option.type !== 'submenu' && option.addDividerAfter && (
                  <Menu.Separator />
                )}
              </Fragment>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

interface TypeMenuProps {
  menuButton: ReactElement;
  onSelect: (typeId: string) => void;
  dataTestId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const TypeMenu: FC<TypeMenuProps> = ({
  menuButton,
  onSelect,
  dataTestId,
  open,
  onOpenChange,
}) => {
  const handleOpenChange = (details: { open: boolean }) => {
    onOpenChange?.(details.open);
  };

  return (
    <Menu.Root open={open} onOpenChange={handleOpenChange}>
      <Menu.Trigger asChild>{menuButton}</Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {typeMenuGroups.map((group) => (
              <Fragment key={group.id}>
                {group.options.map((option) =>
                  option.type === 'submenu' ? (
                    <SubMenu
                      key={option.id}
                      label={option.label}
                      options={option.items}
                      onSelect={onSelect}
                      dataTestIdPrefix={`${dataTestId}-menu-sub`}
                    />
                  ) : (
                    <Menu.Item
                      key={option.id}
                      value={option.id}
                      data-testid={`${dataTestId}-menu-type-${option.id}`}
                      onClick={() => onSelect(option.id)}
                    >
                      {option.label}
                    </Menu.Item>
                  ),
                )}
                {group.addDividerAfter && <Menu.Separator />}
              </Fragment>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
