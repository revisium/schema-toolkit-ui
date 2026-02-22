import { FC, useCallback, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Flex, HStack, IconButton, Text } from '@chakra-ui/react';
import { PiInfo, PiUploadThin } from 'react-icons/pi';
import { Tooltip } from '../../../../components/Tooltip/Tooltip.js';
import { FileHoverCard } from '../../../../row-editor/ui/editors/FileHoverCard.js';
import type { CellVM } from '../../model/CellVM.js';
import { CellTextareaEditor } from './CellTextareaEditor.js';
import { CellWrapper } from './CellWrapper.js';
import { useTextareaCell } from './useTextareaCell.js';

interface FileCellProps {
  cell: CellVM;
  onUploadFile?: (
    fileId: string,
    file: File,
  ) => Promise<Record<string, unknown> | null>;
  onOpenFile?: (url: string) => void;
}

export const FileCell: FC<FileCellProps> = observer(
  ({ cell, onUploadFile, onOpenFile }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileData = cell.fileData;

    const status = fileData?.status ?? '';
    const fileId = fileData?.fileId ?? '';
    const url = fileData?.url ?? '';
    const mimeType = fileData?.mimeType ?? '';
    const width = fileData?.width ?? 0;
    const height = fileData?.height ?? 0;

    const isReadonly = cell.isReadOnly;
    const isEditing = cell.isEditing;
    const availablePreview = mimeType.startsWith('image/');
    const showViewFile = Boolean(url);
    const showUploadFile =
      !isReadonly &&
      Boolean(onUploadFile) &&
      (status === 'ready' || status === 'uploaded');
    const showInfo = !showViewFile && !showUploadFile && isReadonly;

    const {
      cellRef,
      textRef,
      getEditPosition,
      clickOffsetValue,
      appendCharValue,
      startEditing,
      handleTypeChar,
      handleCommit,
      handleCommitEnter,
      handleCancel,
      handleStartEditFromKeyboard,
    } = useTextareaCell(cell);

    const handleFileChange = useCallback(
      async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
          return;
        }
        event.target.value = '';
        try {
          const result = await onUploadFile?.(fileId, file);
          if (result) {
            cell.commitFileUpload(result);
          }
        } catch {
          // upload failed — no-op, caller is responsible for error reporting
        }
      },
      [onUploadFile, fileId, cell],
    );

    const handleOpenFile = useCallback(() => {
      if (onOpenFile) {
        onOpenFile(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }, [onOpenFile, url]);

    const handleUploadClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      fileInputRef.current?.click();
    }, []);

    const editPosition = isEditing ? getEditPosition() : null;

    return (
      <Box ref={cellRef}>
        <CellWrapper
          cell={cell}
          onDoubleClick={cell.isEditable ? startEditing : undefined}
          onStartEdit={
            cell.isEditable ? handleStartEditFromKeyboard : undefined
          }
          onTypeChar={cell.isEditable ? handleTypeChar : undefined}
        >
          <HStack gap={1} width="100%" justifyContent="space-between">
            <Text
              ref={textRef as React.RefObject<HTMLParagraphElement>}
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
              fontWeight="300"
              flex={1}
              minWidth={0}
            >
              {cell.displayValue}
            </Text>
            <Flex
              className="file-action-buttons"
              alignItems="center"
              flexShrink={0}
              opacity={0}
              transition="opacity 0.15s ease"
              css={{
                'td:hover &, &[data-visible]': {
                  opacity: 1,
                },
              }}
              {...(showInfo ? { 'data-visible': true } : {})}
            >
              {showInfo && (
                <Tooltip
                  openDelay={50}
                  closeDelay={50}
                  content="The file was not uploaded in this revision"
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
                  dataTestId={`cell-file-open-${cell.rowId}-${cell.field}`}
                />
              )}
              {showUploadFile && (
                <Box>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    data-testid={`cell-file-input-${cell.rowId}-${cell.field}`}
                  />
                  <IconButton
                    aria-label="Upload file"
                    variant="ghost"
                    size="2xs"
                    color={showViewFile ? 'gray.300' : 'gray.500'}
                    _hover={{ bg: 'gray.100', color: 'black' }}
                    onClick={handleUploadClick}
                    data-testid={`cell-file-upload-${cell.rowId}-${cell.field}`}
                  >
                    <PiUploadThin />
                  </IconButton>
                </Box>
              )}
              {!showInfo && !showViewFile && !showUploadFile && !isReadonly && (
                <Tooltip
                  openDelay={50}
                  closeDelay={50}
                  content="Save the row first, then upload the file"
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
            </Flex>
          </HStack>
        </CellWrapper>
        {editPosition && (
          <CellTextareaEditor
            value={cell.displayValue}
            position={editPosition}
            clickOffset={clickOffsetValue}
            appendChar={appendCharValue}
            autoHeight
            onCommit={handleCommit}
            onCommitEnter={handleCommitEnter}
            onCancel={handleCancel}
            testId="file-cell-input"
          />
        )}
      </Box>
    );
  },
);
