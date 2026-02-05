import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC, useMemo } from 'react';
import type { SchemaPatch } from '@revisium/schema-toolkit';
import {
  getTransformationInfoFromTypeChange,
  getDefaultValueExample,
} from '../../../../model/utils';
import { OperationDescription } from './OperationDescription';
import { DefaultValueRow } from './DefaultValueRow';
import { TransformationInfoRow } from './TransformationInfoRow';
import { ValueChangeRow } from './ValueChangeRow';
import { MetadataChangesRow } from './MetadataChangesRow';
import { formatChangeValue } from './helpers';

interface PatchRowProps {
  schemaPatch: SchemaPatch;
}

export const PatchRow: FC<PatchRowProps> = observer(({ schemaPatch }) => {
  const {
    patch,
    metadataChanges,
    typeChange,
    formulaChange,
    defaultChange,
    descriptionChange,
    deprecatedChange,
    foreignKeyChange,
    contentMediaTypeChange,
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
    if (patch.op === 'add' && patch.value !== undefined) {
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
          <ValueChangeRow
            label="formula"
            fromValue={formatChangeValue(formulaChange.fromFormula)}
            toValue={formatChangeValue(formulaChange.toFormula)}
          />
        </Box>
      )}

      {defaultChange && (
        <Box mt={2} ml={8}>
          <ValueChangeRow
            label="default"
            fromValue={formatChangeValue(defaultChange.fromDefault)}
            toValue={formatChangeValue(defaultChange.toDefault)}
          />
        </Box>
      )}

      {descriptionChange && (
        <Box mt={2} ml={8}>
          <ValueChangeRow
            label="description"
            fromValue={formatChangeValue(descriptionChange.fromDescription)}
            toValue={formatChangeValue(descriptionChange.toDescription)}
          />
        </Box>
      )}

      {deprecatedChange && (
        <Box mt={2} ml={8}>
          <ValueChangeRow
            label="deprecated"
            fromValue={formatChangeValue(deprecatedChange.fromDeprecated)}
            toValue={formatChangeValue(deprecatedChange.toDeprecated)}
          />
        </Box>
      )}

      {foreignKeyChange && (
        <Box mt={2} ml={8}>
          <ValueChangeRow
            label="foreignKey"
            fromValue={formatChangeValue(foreignKeyChange.fromForeignKey)}
            toValue={formatChangeValue(foreignKeyChange.toForeignKey)}
          />
        </Box>
      )}

      {contentMediaTypeChange && (
        <Box mt={2} ml={8}>
          <ValueChangeRow
            label="contentMediaType"
            fromValue={formatChangeValue(
              contentMediaTypeChange.fromContentMediaType,
            )}
            toValue={formatChangeValue(
              contentMediaTypeChange.toContentMediaType,
            )}
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
