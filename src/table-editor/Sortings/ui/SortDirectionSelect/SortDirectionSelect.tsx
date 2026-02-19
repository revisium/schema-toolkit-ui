import { observer } from 'mobx-react-lite';
import { Box, Menu, Text } from '@chakra-ui/react';
import type { IconType } from 'react-icons';
import {
  PiArrowDownLight,
  PiArrowUpLight,
  PiCaretDownLight,
} from 'react-icons/pi';

interface SortDirectionSelectProps {
  selectedDirection: 'asc' | 'desc';
  onSelect: (direction: 'asc' | 'desc') => void;
}

const directions: {
  value: 'asc' | 'desc';
  label: string;
  icon: IconType;
}[] = [
  { value: 'asc', label: 'A—Z', icon: PiArrowUpLight },
  { value: 'desc', label: 'Z—A', icon: PiArrowDownLight },
];

export const SortDirectionSelect = observer(
  ({ selectedDirection, onSelect }: SortDirectionSelectProps) => {
    const ascDirection = directions[0] as (typeof directions)[number];
    const selected =
      directions.find((d) => d.value === selectedDirection) ?? ascDirection;
    const Icon = selected.icon;

    return (
      <Menu.Root>
        <Menu.Trigger asChild>
          <Box
            display="flex"
            alignItems="center"
            gap={1.5}
            px={4}
            h="40px"
            borderRadius="lg"
            bg="gray.100"
            cursor="pointer"
            minW="80px"
            _hover={{ bg: 'gray.200' }}
            data-testid="sort-direction-select"
          >
            <Icon size={18} />
            <Text fontSize="md" fontWeight="medium">
              {selected.label}
            </Text>
            <Box color="gray.400" ml="auto">
              <PiCaretDownLight size={14} />
            </Box>
          </Box>
        </Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content minW="120px">
            {directions.map((dir) => {
              const DirIcon = dir.icon;
              return (
                <Menu.Item
                  key={dir.value}
                  value={dir.value}
                  onClick={() => onSelect(dir.value)}
                  bg={selectedDirection === dir.value ? 'gray.100' : undefined}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <DirIcon size={18} />
                    <Text fontWeight="medium">{dir.label}</Text>
                  </Box>
                </Menu.Item>
              );
            })}
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>
    );
  },
);
