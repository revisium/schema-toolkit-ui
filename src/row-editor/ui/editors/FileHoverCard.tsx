import { FC } from 'react';
import { HoverCard, Portal, Image, IconButton } from '@chakra-ui/react';
import { PiFile } from 'react-icons/pi';

interface FileIconProps {
  url: string;
  onClick: () => void;
  dataTestId?: string;
}

const FileIcon: FC<FileIconProps> = ({ onClick, dataTestId }) => {
  return (
    <IconButton
      data-testid={dataTestId}
      aria-label="Open file"
      variant="ghost"
      size="2xs"
      color="gray.400"
      _hover={{ bg: 'gray.100', color: 'black' }}
      onClick={onClick}
    >
      <PiFile />
    </IconButton>
  );
};

interface FileHoverCardProps {
  url: string;
  availablePreview: boolean;
  width: number;
  height: number;
  onClick: () => void;
  dataTestId?: string;
}

export const FileHoverCard: FC<FileHoverCardProps> = ({
  url,
  availablePreview,
  width,
  height,
  onClick,
  dataTestId,
}) => {
  if (!availablePreview) {
    return <FileIcon url={url} onClick={onClick} dataTestId={dataTestId} />;
  }

  return (
    <HoverCard.Root
      lazyMount
      unmountOnExit
      openDelay={350}
      closeDelay={100}
      positioning={{ gutter: 16 }}
    >
      <HoverCard.Trigger asChild>
        <span>
          <FileIcon url={url} onClick={onClick} dataTestId={dataTestId} />
        </span>
      </HoverCard.Trigger>
      <Portal>
        <HoverCard.Positioner>
          <HoverCard.Content>
            <HoverCard.Arrow>
              <HoverCard.ArrowTip />
            </HoverCard.Arrow>
            <Image
              aspectRatio={height > 0 ? width / height : 1}
              width="400px"
              src={url}
              alt="File preview"
            />
          </HoverCard.Content>
        </HoverCard.Positioner>
      </Portal>
    </HoverCard.Root>
  );
};
