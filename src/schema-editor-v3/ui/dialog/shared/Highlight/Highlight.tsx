import { Box } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';

interface HighlightProps {
  children: ReactNode;
}

export const Highlight: FC<HighlightProps> = ({ children }) => (
  <Box as="span" px="1" bg="gray.100" borderRadius="sm" whiteSpace="nowrap">
    {children}
  </Box>
);
