import { Badge, Flex, Icon, Text } from '@chakra-ui/react';
import { FC } from 'react';
import { PiPencilSimpleLight } from 'react-icons/pi';
import type { SchemaPatch } from '@revisium/schema-toolkit';
import { Highlight } from '../Highlight';
import { operationIcons, getFromFieldName, PatchOp } from './helpers';

interface OperationDescriptionProps {
  schemaPatch: SchemaPatch;
}

export const OperationDescription: FC<OperationDescriptionProps> = ({
  schemaPatch,
}) => {
  const { patch, fieldName } = schemaPatch;
  const IconComponent = operationIcons[patch.op as PatchOp];

  switch (patch.op) {
    case 'add':
      return (
        <Flex align="center" gap={1.5}>
          <Icon
            as={IconComponent}
            color="gray.400"
            boxSize={4}
            flexShrink={0}
          />
          <Text fontSize="sm" color="gray.600">
            Field <Highlight>{fieldName}</Highlight> was added
          </Text>
        </Flex>
      );
    case 'remove':
      return (
        <Flex align="center" gap={1.5}>
          <Icon
            as={IconComponent}
            color="gray.400"
            boxSize={4}
            flexShrink={0}
          />
          <Text fontSize="sm" color="gray.600">
            Field <Highlight>{fieldName}</Highlight> was removed
          </Text>
        </Flex>
      );
    case 'move': {
      const fromField = getFromFieldName(patch);
      if (schemaPatch.isRename) {
        return (
          <Flex align="center" gap={1.5}>
            <Icon
              as={IconComponent}
              color="gray.400"
              boxSize={4}
              flexShrink={0}
            />
            <Text fontSize="sm" color="gray.600">
              Renamed field <Highlight>{fromField}</Highlight> to{' '}
              <Highlight>{fieldName}</Highlight>
            </Text>
          </Flex>
        );
      }
      return (
        <Flex align="center" gap={1.5}>
          <Icon
            as={IconComponent}
            color="gray.400"
            boxSize={4}
            flexShrink={0}
          />
          <Text fontSize="sm" color="gray.600">
            Moved field <Highlight>{fromField}</Highlight> to{' '}
            <Highlight>{fieldName}</Highlight>
          </Text>
          {schemaPatch.movesIntoArray && (
            <Badge size="sm" colorPalette="yellow" variant="subtle">
              data will be cloned
            </Badge>
          )}
        </Flex>
      );
    }
    case 'replace':
      return (
        <Flex align="center" gap={1.5}>
          <Icon
            as={IconComponent}
            color="gray.400"
            boxSize={4}
            flexShrink={0}
          />
          <Text fontSize="sm" color="gray.600">
            Field <Highlight>{fieldName}</Highlight> was modified
          </Text>
        </Flex>
      );
    default:
      return (
        <Flex align="center" gap={1.5}>
          <Icon
            as={PiPencilSimpleLight}
            color="gray.400"
            boxSize={4}
            flexShrink={0}
          />
          <Text fontSize="sm" color="gray.600">
            Field <Highlight>{fieldName}</Highlight> was changed
          </Text>
        </Flex>
      );
  }
};
