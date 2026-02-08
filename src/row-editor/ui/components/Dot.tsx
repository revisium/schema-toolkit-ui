import { FC } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { MdOutlineChevronRight } from 'react-icons/md';
import { PiDotOutlineFill } from 'react-icons/pi';

export interface DotProps {
  isCollapsed?: boolean;
  isCollapsible?: boolean;
  toggleCollapsed?: () => void;
  testId?: string;
}

const getDotTestId = (
  testId: string | undefined,
  isCollapsed: boolean | undefined,
): string | undefined => {
  if (!testId) {
    return undefined;
  }
  return isCollapsed ? `${testId}-expand` : `${testId}-collapse`;
};

export const Dot: FC<DotProps> = ({
  isCollapsed,
  isCollapsible,
  toggleCollapsed,
  testId,
}) => {
  return (
    <>
      {!isCollapsed && (
        <Flex
          color="gray.300"
          width="16px"
          height="28px"
          _groupHover={{
            display: isCollapsible ? 'none' : 'flex',
          }}
          alignItems="center"
          justifyContent="center"
        >
          <PiDotOutlineFill />
        </Flex>
      )}
      {isCollapsible && (
        <Flex
          _groupHover={{
            display: 'inline-flex',
            color: 'gray.500',
          }}
          display={isCollapsed ? 'inline-flex' : 'none'}
          _hover={{
            backgroundColor: 'transparent',
          }}
          color="gray.400"
          onClick={toggleCollapsed}
          width="16px"
          height="28px"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          data-testid={getDotTestId(testId, isCollapsed)}
        >
          <Box transform={isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)'}>
            <MdOutlineChevronRight size={16} />
          </Box>
        </Flex>
      )}
    </>
  );
};
