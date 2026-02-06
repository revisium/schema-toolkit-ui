import { Box } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';

interface CodeBoxProps {
  children: ReactNode;
}

export const CodeBox: FC<CodeBoxProps> = ({ children }) => (
  <Box
    as="code"
    px={1}
    py={0.5}
    bg="gray.100"
    borderRadius="sm"
    fontFamily="mono"
  >
    {children}
  </Box>
);
