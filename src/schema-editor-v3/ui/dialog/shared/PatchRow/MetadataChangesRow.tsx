import { Badge, Flex } from '@chakra-ui/react';
import { FC } from 'react';
import type { MetadataChangeType } from '@revisium/schema-toolkit';

interface MetadataChangesRowProps {
  changes: MetadataChangeType[];
}

export const MetadataChangesRow: FC<MetadataChangesRowProps> = ({
  changes,
}) => {
  const filteredChanges = changes.filter(
    (change) =>
      change !== 'formula' &&
      change !== 'default' &&
      change !== 'description' &&
      change !== 'deprecated' &&
      change !== 'foreignKey',
  );

  if (filteredChanges.length === 0) {
    return null;
  }

  return (
    <Flex align="center" gap={2} fontSize="xs" pl={2} flexWrap="wrap">
      {filteredChanges.map((change) => (
        <Badge key={change} size="sm" colorPalette="gray" variant="subtle">
          {change}
        </Badge>
      ))}
    </Flex>
  );
};
