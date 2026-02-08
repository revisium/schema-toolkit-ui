import { FC } from 'react';
import { Box, Flex } from '@chakra-ui/react';

export interface GuidesProps {
  guides: boolean[];
}

interface GuideItem {
  key: string;
  showLine: boolean;
}

function toGuideItems(guides: boolean[]): GuideItem[] {
  return guides.map((showLine, i) => ({ key: `d${i}`, showLine }));
}

export const Guides: FC<GuidesProps> = ({ guides }) => {
  const items = toGuideItems(guides);

  return (
    <Flex position="relative" alignItems="center">
      <Box left="-48px" width="48px" height="100%" position="absolute" />
      {items.map((item) => (
        <Box
          key={item.key}
          position="relative"
          width="24px"
          height="100%"
          _before={
            item.showLine
              ? {
                  content: '""',
                  position: 'absolute',
                  left: '8px',
                  top: 0,
                  bottom: 0,
                  width: '1px',
                  backgroundColor: 'blackAlpha.200',
                }
              : undefined
          }
        />
      ))}
    </Flex>
  );
};
