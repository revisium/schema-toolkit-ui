import { observer } from 'mobx-react-lite';
import {
  Badge,
  Box,
  Button,
  HStack,
  Popover,
  Portal,
  Text,
} from '@chakra-ui/react';
import { LuInfo } from 'react-icons/lu';
import type { ViewSettingsBadgeModel } from '../model/ViewSettingsBadgeModel.js';

interface ViewSettingsBadgeProps {
  model: ViewSettingsBadgeModel;
}

export const ViewSettingsBadge = observer(
  ({ model }: ViewSettingsBadgeProps) => {
    if (!model.isVisible) {
      return null;
    }

    const badgeColor = model.canSave ? 'orange' : 'gray';
    const dotColor = model.canSave ? 'orange.500' : 'gray.400';
    const badgeLabel = model.canSave ? 'unsaved' : 'local';
    const title = model.canSave
      ? 'Unsaved view settings'
      : 'Local view changes';
    const description = model.canSave
      ? 'Column order, widths, and sort settings will be saved to the Default view and shared with everyone.'
      : 'View settings can only be saved in draft revisions. These changes are temporary and will be lost when you leave.';
    const revertLabel = model.canSave ? 'Revert' : 'Reset';

    return (
      <Popover.Root
        open={model.isPopoverOpen}
        onOpenChange={(e) => model.setPopoverOpen(e.open)}
        lazyMount
        unmountOnExit
      >
        <Popover.Trigger asChild>
          <Badge
            variant="subtle"
            size="sm"
            colorPalette={badgeColor}
            cursor="pointer"
            display="flex"
            alignItems="center"
            gap={1}
            _hover={{ opacity: 0.8 }}
            data-testid="view-settings-badge"
          >
            <Box width="6px" height="6px" borderRadius="full" bg={dotColor} />
            {badgeLabel}
          </Badge>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content p={3} maxW="300px">
              <HStack mb={2}>
                <Box color="gray.400">
                  <LuInfo size={16} />
                </Box>
                <Text fontWeight="semibold" fontSize="sm">
                  {title}
                </Text>
              </HStack>
              <Text fontSize="sm" color="gray.600" mb={3}>
                {description}
              </Text>
              <HStack>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    model.revert();
                    model.setPopoverOpen(false);
                  }}
                  data-testid="view-settings-revert"
                >
                  {revertLabel}
                </Button>
                {model.canSave && (
                  <Button
                    colorPalette="blue"
                    size="xs"
                    onClick={() => {
                      model.save();
                      model.setPopoverOpen(false);
                    }}
                    data-testid="view-settings-save"
                  >
                    Save
                  </Button>
                )}
              </HStack>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    );
  },
);
