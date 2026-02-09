import { FC, useCallback, useRef } from 'react';
import { Box, Flex, IconButton } from '@chakra-ui/react';
import { PiInfo, PiUploadThin } from 'react-icons/pi';
import { observer } from 'mobx-react-lite';
import { Tooltip } from '../../../components/Tooltip';
import { FileHoverCard } from './FileHoverCard';
import type { FileNodeVM } from '../../vm/types';

interface FileActionsProps {
  node: FileNodeVM;
}

export const FileActions: FC<FileActionsProps> = observer(({ node }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const url = node.fileUrl;
  const fileId = node.fileId;
  const status = node.fileStatus;
  const mimeType = node.fileMimeType;
  const width = node.fileWidth;
  const height = node.fileHeight;
  const readonly = node.isEditorReadOnly;

  const availablePreview = mimeType.startsWith('image/');
  const showViewFile = Boolean(url);
  const showUploadFile =
    !readonly &&
    Boolean(node.callbacks?.onUploadFile) &&
    (status === 'ready' || status === 'uploaded');
  const showInfo = !showViewFile && !showUploadFile;

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      await node.callbacks?.onUploadFile?.(fileId, file);
      event.target.value = '';
    },
    [node, fileId],
  );

  const handleOpenFile = useCallback(() => {
    if (node.callbacks?.onOpenFile) {
      node.callbacks.onOpenFile(url);
    } else {
      window.open(url, '_blank');
    }
  }, [node, url]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <Flex alignItems="center">
      {showInfo && (
        <Tooltip
          openDelay={50}
          closeDelay={50}
          content={
            readonly
              ? 'The file was not uploaded in this revision'
              : 'Save the row first, then upload the file'
          }
        >
          <Flex
            width="24px"
            height="24px"
            alignItems="center"
            justifyContent="center"
            color="gray.400"
          >
            <PiInfo />
          </Flex>
        </Tooltip>
      )}
      {showViewFile && (
        <FileHoverCard
          url={url}
          availablePreview={availablePreview}
          width={width}
          height={height}
          onClick={handleOpenFile}
          dataTestId={`${node.testId}-open-file`}
        />
      )}
      {showUploadFile && (
        <Box>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            data-testid={`${node.testId}-file-input`}
          />
          <IconButton
            aria-label="Upload file"
            variant="ghost"
            size="2xs"
            color={showViewFile ? 'gray.300' : 'gray.500'}
            _hover={{ bg: 'gray.100', color: 'black' }}
            onClick={handleUploadClick}
            data-testid={`${node.testId}-upload-file`}
          >
            <PiUploadThin />
          </IconButton>
        </Box>
      )}
    </Flex>
  );
});
