import { Badge } from '@chakra-ui/react';
import { FC } from 'react';
import type { DataLossSeverity } from '../../../../model/utils';

interface DataLossBadgeProps {
  severity: DataLossSeverity;
}

export const DataLossBadge: FC<DataLossBadgeProps> = ({ severity }) => {
  if (severity === 'none') {
    return null;
  }

  if (severity === 'possible') {
    return (
      <Badge size="sm" colorPalette="yellow" variant="subtle">
        data may be lost
      </Badge>
    );
  }

  return (
    <Badge size="sm" colorPalette="red" variant="subtle">
      data loss
    </Badge>
  );
};
