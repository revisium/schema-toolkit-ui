import {
  Badge,
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
} from '@chakra-ui/react/dialog';
import { observer } from 'mobx-react-lite';
import { FC, useMemo } from 'react';
import {
  PiArrowCounterClockwiseBold,
  PiArrowRight,
  PiPlusLight,
  PiMinusLight,
  PiArrowsLeftRightLight,
  PiPencilSimpleLight,
  PiWarningCircle,
} from 'react-icons/pi';
import { IconType } from 'react-icons';
import type {
  SchemaPatch,
  MetadataChangeType,
  DefaultValueType,
  TransformationInfo,
  DataLossSeverity,
  DefaultValueExample,
  SchemaValidationError,
  FormulaErrorInfo,
} from '../../model';
import {
  getTransformationInfoFromTypeChange,
  getDefaultValueExample,
} from '../../model';

interface ChangesPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onRevert: () => void;
  patches: SchemaPatch[];
  isLoading?: boolean;
  tableId: string;
  validationErrors?: SchemaValidationError[];
  formulaErrors?: FormulaErrorInfo[];
}

type PatchOp = 'add' | 'remove' | 'move' | 'replace';

const operationIcons: Record<PatchOp, IconType> = {
  add: PiPlusLight,
  remove: PiMinusLight,
  move: PiArrowsLeftRightLight,
  replace: PiPencilSimpleLight,
};

const Highlight: FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box as="span" px="1" bg="gray.100" borderRadius="sm" whiteSpace="nowrap">
    {children}
  </Box>
);

const DataLossBadge: FC<{ severity: DataLossSeverity }> = ({ severity }) => {
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

const TransformationInfoRow: FC<{ info: TransformationInfo }> = ({ info }) => {
  return (
    <VStack align="stretch" gap={1} pl={2}>
      <Flex align="center" gap={2} fontSize="xs" flexWrap="wrap">
        {info.steps.map((step, stepIndex) => (
          <Flex key={step.name} align="center" gap={1}>
            {stepIndex > 0 && <Text color="gray.400">+</Text>}
            <Badge size="sm" colorPalette="gray" variant="subtle">
              {step.name}
            </Badge>
          </Flex>
        ))}
        <DataLossBadge severity={info.dataLossSeverity} />
      </Flex>

      <Flex align="center" gap={2} fontSize="xs" color="gray.500">
        <Text color="gray.400">example:</Text>
        <Box
          as="code"
          px={1}
          py={0.5}
          bg="gray.100"
          borderRadius="sm"
          fontFamily="mono"
        >
          {JSON.stringify(info.example.before)}
        </Box>
        <Icon as={PiArrowRight} color="gray.400" flexShrink={0} />
        <Box
          as="code"
          px={1}
          py={0.5}
          bg="gray.100"
          borderRadius="sm"
          fontFamily="mono"
        >
          {JSON.stringify(info.example.after)}
        </Box>
      </Flex>
    </VStack>
  );
};

const formatDefaultValue = (value: unknown): string => {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2);
  }
  return JSON.stringify(value);
};

const DefaultValueRow: FC<{ example: DefaultValueExample }> = ({ example }) => {
  const { value, type, foreignKeyTableId } = example;

  if (foreignKeyTableId) {
    return (
      <Flex align="center" gap={2} fontSize="xs" color="gray.500" pl={2}>
        <Text color="gray.400">foreignKey:</Text>
        <Badge size="sm" colorPalette="blue" variant="subtle">
          {foreignKeyTableId}
        </Badge>
      </Flex>
    );
  }

  const formattedValue = formatDefaultValue(value);
  const isMultiline = formattedValue.includes('\n');

  return (
    <Flex
      align={isMultiline ? 'flex-start' : 'center'}
      gap={2}
      fontSize="xs"
      color="gray.500"
      pl={2}
    >
      <Text color="gray.400">default:</Text>
      <Box
        as="code"
        px={isMultiline ? 2 : 1}
        py={isMultiline ? 1.5 : 0.5}
        bg="gray.100"
        borderRadius="sm"
        fontFamily="mono"
        whiteSpace={isMultiline ? 'pre' : 'nowrap'}
      >
        {formattedValue}
      </Box>
      <Text color="gray.400">({type})</Text>
    </Flex>
  );
};

const MetadataChangesRow: FC<{ changes: MetadataChangeType[] }> = ({
  changes,
}) => {
  const filteredChanges = changes.filter(
    (change) =>
      change !== 'formula' &&
      change !== 'default' &&
      change !== 'description' &&
      change !== 'deprecated',
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

interface DescriptionChangeRowProps {
  fromDescription: string | undefined;
  toDescription: string | undefined;
}

const DescriptionChangeRow: FC<DescriptionChangeRowProps> = ({
  fromDescription,
  toDescription,
}) => {
  return (
    <Flex
      align="center"
      gap={2}
      fontSize="xs"
      color="gray.500"
      pl={2}
      flexWrap="wrap"
    >
      <Text color="gray.400">description:</Text>
      <Box
        as="code"
        px={1}
        py={0.5}
        bg="gray.100"
        borderRadius="sm"
        fontFamily="mono"
      >
        {fromDescription === undefined
          ? '(none)'
          : JSON.stringify(fromDescription)}
      </Box>
      <Icon as={PiArrowRight} color="gray.400" flexShrink={0} />
      <Box
        as="code"
        px={1}
        py={0.5}
        bg="gray.100"
        borderRadius="sm"
        fontFamily="mono"
      >
        {toDescription === undefined ? '(none)' : JSON.stringify(toDescription)}
      </Box>
    </Flex>
  );
};

interface DeprecatedChangeRowProps {
  fromDeprecated: boolean | undefined;
  toDeprecated: boolean | undefined;
}

const DeprecatedChangeRow: FC<DeprecatedChangeRowProps> = ({
  fromDeprecated,
  toDeprecated,
}) => {
  return (
    <Flex
      align="center"
      gap={2}
      fontSize="xs"
      color="gray.500"
      pl={2}
      flexWrap="wrap"
    >
      <Text color="gray.400">deprecated:</Text>
      <Box
        as="code"
        px={1}
        py={0.5}
        bg="gray.100"
        borderRadius="sm"
        fontFamily="mono"
      >
        {fromDeprecated === undefined ? '(none)' : String(fromDeprecated)}
      </Box>
      <Icon as={PiArrowRight} color="gray.400" flexShrink={0} />
      <Box
        as="code"
        px={1}
        py={0.5}
        bg="gray.100"
        borderRadius="sm"
        fontFamily="mono"
      >
        {toDeprecated === undefined ? '(none)' : String(toDeprecated)}
      </Box>
    </Flex>
  );
};

interface FormulaChangeRowProps {
  fromFormula: string | undefined;
  toFormula: string | undefined;
}

const FormulaChangeRow: FC<FormulaChangeRowProps> = ({
  fromFormula,
  toFormula,
}) => {
  return (
    <Flex
      align="center"
      gap={2}
      fontSize="xs"
      color="gray.500"
      pl={2}
      flexWrap="wrap"
    >
      <Text color="gray.400">formula:</Text>
      <Box
        as="code"
        px={1}
        py={0.5}
        bg="gray.100"
        borderRadius="sm"
        fontFamily="mono"
      >
        {fromFormula ?? '(none)'}
      </Box>
      <Icon as={PiArrowRight} color="gray.400" flexShrink={0} />
      <Box
        as="code"
        px={1}
        py={0.5}
        bg="gray.100"
        borderRadius="sm"
        fontFamily="mono"
      >
        {toFormula ?? '(none)'}
      </Box>
    </Flex>
  );
};

interface DefaultChangeRowProps {
  fromDefault: DefaultValueType;
  toDefault: DefaultValueType;
}

const DefaultChangeRow: FC<DefaultChangeRowProps> = ({
  fromDefault,
  toDefault,
}) => {
  return (
    <Flex
      align="center"
      gap={2}
      fontSize="xs"
      color="gray.500"
      pl={2}
      flexWrap="wrap"
    >
      <Text color="gray.400">default:</Text>
      <Box
        as="code"
        px={1}
        py={0.5}
        bg="gray.100"
        borderRadius="sm"
        fontFamily="mono"
      >
        {fromDefault === undefined ? '(none)' : JSON.stringify(fromDefault)}
      </Box>
      <Icon as={PiArrowRight} color="gray.400" flexShrink={0} />
      <Box
        as="code"
        px={1}
        py={0.5}
        bg="gray.100"
        borderRadius="sm"
        fontFamily="mono"
      >
        {toDefault === undefined ? '(none)' : JSON.stringify(toDefault)}
      </Box>
    </Flex>
  );
};

interface PatchRowProps {
  schemaPatch: SchemaPatch;
}

const getFromFieldName = (patch: SchemaPatch['patch']): string => {
  if (patch.op === 'move' && patch.from) {
    const parts = patch.from.split('/').filter(Boolean);
    const segments: string[] = [];

    let i = 0;
    while (i < parts.length) {
      const part = parts[i];
      if (part === 'properties' && i + 1 < parts.length) {
        segments.push(parts[i + 1] ?? '');
        i += 2;
      } else if (part === 'items') {
        if (segments.length > 0) {
          segments[segments.length - 1] += '[*]';
        }
        i += 1;
      } else {
        i += 1;
      }
    }

    return segments.join('.');
  }
  return '';
};

const OperationDescription: FC<{ schemaPatch: SchemaPatch }> = ({
  schemaPatch,
}) => {
  const { patch, fieldName } = schemaPatch;
  const IconComponent = operationIcons[patch.op as PatchOp];

  switch (patch.op) {
    case 'add':
      return (
        <Flex align="center" gap={1.5}>
          <Icon
            as={IconComponent}
            color="gray.400"
            boxSize={4}
            flexShrink={0}
          />
          <Text fontSize="sm" color="gray.600">
            Field <Highlight>{fieldName}</Highlight> was added
          </Text>
        </Flex>
      );
    case 'remove':
      return (
        <Flex align="center" gap={1.5}>
          <Icon
            as={IconComponent}
            color="gray.400"
            boxSize={4}
            flexShrink={0}
          />
          <Text fontSize="sm" color="gray.600">
            Field <Highlight>{fieldName}</Highlight> was removed
          </Text>
        </Flex>
      );
    case 'move': {
      const fromField = getFromFieldName(patch);
      if (schemaPatch.isRename) {
        return (
          <Flex align="center" gap={1.5}>
            <Icon
              as={IconComponent}
              color="gray.400"
              boxSize={4}
              flexShrink={0}
            />
            <Text fontSize="sm" color="gray.600">
              Renamed field <Highlight>{fromField}</Highlight> to{' '}
              <Highlight>{fieldName}</Highlight>
            </Text>
          </Flex>
        );
      }
      return (
        <Flex align="center" gap={1.5}>
          <Icon
            as={IconComponent}
            color="gray.400"
            boxSize={4}
            flexShrink={0}
          />
          <Text fontSize="sm" color="gray.600">
            Moved field <Highlight>{fromField}</Highlight> to{' '}
            <Highlight>{fieldName}</Highlight>
          </Text>
          {schemaPatch.movesIntoArray && (
            <Badge size="sm" colorPalette="yellow" variant="subtle">
              data will be cloned
            </Badge>
          )}
        </Flex>
      );
    }
    case 'replace':
      return (
        <Flex align="center" gap={1.5}>
          <Icon
            as={IconComponent}
            color="gray.400"
            boxSize={4}
            flexShrink={0}
          />
          <Text fontSize="sm" color="gray.600">
            Field <Highlight>{fieldName}</Highlight> was modified
          </Text>
        </Flex>
      );
    default:
      return (
        <Flex align="center" gap={1.5}>
          <Icon
            as={PiPencilSimpleLight}
            color="gray.400"
            boxSize={4}
            flexShrink={0}
          />
          <Text fontSize="sm" color="gray.600">
            Field <Highlight>{fieldName}</Highlight> was changed
          </Text>
        </Flex>
      );
  }
};

const PatchRow: FC<PatchRowProps> = observer(({ schemaPatch }) => {
  const {
    patch,
    metadataChanges,
    typeChange,
    formulaChange,
    defaultChange,
    descriptionChange,
    deprecatedChange,
  } = schemaPatch;

  const transformationInfo = useMemo(
    () =>
      typeChange
        ? getTransformationInfoFromTypeChange(
            typeChange.fromType,
            typeChange.toType,
          )
        : null,
    [typeChange],
  );
  const defaultExample = useMemo(() => {
    if (patch.op === 'add' && patch.value) {
      return getDefaultValueExample({
        op: 'add',
        path: patch.path,
        value: patch.value,
      });
    }
    return null;
  }, [patch]);

  return (
    <Box
      borderBottom="1px solid"
      borderColor="gray.100"
      py={4}
      px={5}
      _last={{ borderBottom: 'none' }}
      _hover={{ bg: 'gray.50' }}
    >
      <OperationDescription schemaPatch={schemaPatch} />

      {defaultExample && (
        <Box mt={2} ml={8}>
          <DefaultValueRow example={defaultExample} />
        </Box>
      )}

      {transformationInfo && (
        <Box mt={2} ml={8}>
          <TransformationInfoRow info={transformationInfo} />
        </Box>
      )}

      {formulaChange && (
        <Box mt={2} ml={8}>
          <FormulaChangeRow
            fromFormula={formulaChange.fromFormula}
            toFormula={formulaChange.toFormula}
          />
        </Box>
      )}

      {defaultChange && (
        <Box mt={2} ml={8}>
          <DefaultChangeRow
            fromDefault={defaultChange.fromDefault}
            toDefault={defaultChange.toDefault}
          />
        </Box>
      )}

      {descriptionChange && (
        <Box mt={2} ml={8}>
          <DescriptionChangeRow
            fromDescription={descriptionChange.fromDescription}
            toDescription={descriptionChange.toDescription}
          />
        </Box>
      )}

      {deprecatedChange && (
        <Box mt={2} ml={8}>
          <DeprecatedChangeRow
            fromDeprecated={deprecatedChange.fromDeprecated}
            toDeprecated={deprecatedChange.toDeprecated}
          />
        </Box>
      )}

      {!transformationInfo && metadataChanges.length > 0 && (
        <Box mt={2} ml={8}>
          <MetadataChangesRow changes={metadataChanges} />
        </Box>
      )}
    </Box>
  );
});

interface ErrorItemProps {
  message: string;
  type?: 'validation' | 'formula';
  fieldPath?: string;
}

const ErrorItem: FC<ErrorItemProps> = ({ message, type, fieldPath }) => (
  <Box py={2} px={4}>
    <Flex align="center" gap={2}>
      <Icon as={PiWarningCircle} color="gray.400" boxSize={4} flexShrink={0} />
      <Text fontSize="sm" color="gray.600">
        {type === 'formula' && (
          <Badge size="sm" colorPalette="gray" variant="subtle" mr={2}>
            formula
          </Badge>
        )}
        {fieldPath && (
          <Box as="span" fontWeight="medium">
            {fieldPath}:{' '}
          </Box>
        )}
        {message}
      </Text>
    </Flex>
  </Box>
);

interface ErrorsListProps {
  validationErrors: SchemaValidationError[];
  formulaErrors: FormulaErrorInfo[];
}

const ErrorsList: FC<ErrorsListProps> = ({
  validationErrors,
  formulaErrors,
}) => (
  <Box
    border="1px solid"
    borderColor="gray.200"
    borderRadius="md"
    bg="gray.50"
    overflow="hidden"
  >
    <Box
      py={2}
      px={4}
      bg="gray.100"
      borderBottom="1px solid"
      borderColor="gray.200"
    >
      <Text fontSize="sm" fontWeight="medium" color="gray.600">
        Please fix the following errors before applying changes:
      </Text>
    </Box>
    <VStack align="stretch" gap={0} divideY="1px" divideColor="gray.100">
      {validationErrors.map((error) => (
        <ErrorItem
          key={`validation-${error.nodeId}`}
          message={error.message}
          type="validation"
        />
      ))}
      {formulaErrors.map((error) => (
        <ErrorItem
          key={`formula-${error.fieldPath ?? ''}-${error.message}`}
          message={error.message}
          type="formula"
          fieldPath={error.fieldPath}
        />
      ))}
    </VStack>
  </Box>
);

export const ChangesPreviewDialog: FC<ChangesPreviewDialogProps> = observer(
  ({
    isOpen,
    onClose,
    onApprove,
    onRevert,
    patches,
    isLoading,
    tableId,
    validationErrors = [],
    formulaErrors = [],
  }) => {
    const hasChanges = patches.length > 0;
    const hasErrors = validationErrors.length > 0 || formulaErrors.length > 0;
    const canApply = hasChanges && !hasErrors;

    return (
      <DialogRoot
        open={isOpen}
        onOpenChange={({ open }) => !open && onClose()}
        size="lg"
      >
        <Portal>
          <DialogBackdrop />
          <DialogPositioner>
            <DialogContent maxWidth="700px">
              <DialogHeader>
                <DialogTitle>Review Changes for "{tableId}"</DialogTitle>
              </DialogHeader>

              <DialogBody>
                <VStack align="stretch" gap={4}>
                  {hasErrors && (
                    <ErrorsList
                      validationErrors={validationErrors}
                      formulaErrors={formulaErrors}
                    />
                  )}

                  {hasChanges && (
                    <>
                      <Box
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="md"
                        overflow="hidden"
                        maxHeight="400px"
                        overflowY="auto"
                      >
                        {patches.map((schemaPatch) => (
                          <PatchRow
                            key={schemaPatch.patch.path}
                            schemaPatch={schemaPatch}
                          />
                        ))}
                      </Box>

                      {!hasErrors && (
                        <Text fontSize="xs" color="gray.500">
                          Data in existing rows will be automatically
                          transformed according to the new schema.
                        </Text>
                      )}
                    </>
                  )}
                  {!hasChanges && !hasErrors && (
                    <Flex justify="center" align="center" minHeight="100px">
                      <Text color="gray.400" fontSize="sm">
                        No changes to apply
                      </Text>
                    </Flex>
                  )}
                </VStack>
              </DialogBody>

              <DialogFooter>
                <Flex justify="space-between" width="100%">
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={onRevert}
                    disabled={!hasChanges && !hasErrors}
                    title="Revert all changes"
                  >
                    <PiArrowCounterClockwiseBold />
                  </IconButton>
                  <Flex gap={2}>
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    {!hasErrors && (
                      <Button
                        variant="outline"
                        onClick={onApprove}
                        disabled={!canApply}
                        loading={isLoading}
                      >
                        Apply Changes ({patches.length})
                      </Button>
                    )}
                  </Flex>
                </Flex>
              </DialogFooter>

              <DialogCloseTrigger />
            </DialogContent>
          </DialogPositioner>
        </Portal>
      </DialogRoot>
    );
  },
);
