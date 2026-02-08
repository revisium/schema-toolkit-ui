import { FC } from 'react';
import { Text } from '@chakra-ui/react';

export interface MoreProps {
  onClick?: () => void;
  label: string;
}

export const More: FC<MoreProps> = ({ onClick, label }) => {
  return (
    <Text ml="8px" color="gray.300" onClick={onClick} cursor="pointer">
      {label}
    </Text>
  );
};
