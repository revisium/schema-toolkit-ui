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
import { formatChangeValue, getFilteredPropertyChanges } from './helpers';

interface PatchRowProps {
  schemaPatch: SchemaPatch;
}

export const PatchRow: FC<PatchRowProps> = observer(({ schemaPatch }) => {
  const { patch, typeChange, propertyChanges } = schemaPatch;

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

  const filteredChanges = useMemo(
    () => getFilteredPropertyChanges(patch.op, propertyChanges, defaultExample),
    [patch.op, propertyChanges, defaultExample],
  );

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

      {filteredChanges.map((change) => (
        <Box key={change.property} mt={2} ml={8}>
          <ValueChangeRow
            label={change.property}
            fromValue={formatChangeValue(change.from)}
            toValue={formatChangeValue(change.to)}
          />
        </Box>
      ))}
    </Box>
  );
});
