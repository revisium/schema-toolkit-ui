import { getTransformationInfoFromTypeChange } from '../utils/DataTransformations';

describe('DataTransformations', () => {
  describe('getTransformationInfoFromTypeChange', () => {
    it('returns null when types are the same', () => {
      expect(
        getTransformationInfoFromTypeChange('string', 'string'),
      ).toBeNull();
      expect(
        getTransformationInfoFromTypeChange('number', 'number'),
      ).toBeNull();
    });

    it('returns null for unknown types', () => {
      expect(
        getTransformationInfoFromTypeChange('unknown', 'string'),
      ).toBeNull();
      expect(
        getTransformationInfoFromTypeChange('string', 'unknown'),
      ).toBeNull();
    });

    describe('primitive to primitive conversions', () => {
      it('number to string - no data loss', () => {
        const result = getTransformationInfoFromTypeChange('number', 'string');
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('none');
        expect(result?.example).toEqual({ before: 123, after: '123' });
      });

      it('boolean to string - no data loss', () => {
        const result = getTransformationInfoFromTypeChange('boolean', 'string');
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('none');
      });

      it('boolean to number - no data loss', () => {
        const result = getTransformationInfoFromTypeChange('boolean', 'number');
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('none');
        expect(result?.example).toEqual({ before: true, after: 1 });
      });

      it('string to number - possible data loss', () => {
        const result = getTransformationInfoFromTypeChange('string', 'number');
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('possible');
      });

      it('string to boolean - possible data loss', () => {
        const result = getTransformationInfoFromTypeChange('string', 'boolean');
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('possible');
      });

      it('number to boolean - possible data loss', () => {
        const result = getTransformationInfoFromTypeChange('number', 'boolean');
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('possible');
      });
    });

    describe('object conversions - certain data loss', () => {
      it('object to string', () => {
        const result = getTransformationInfoFromTypeChange('object', 'string');
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('certain');
      });

      it('object to number', () => {
        const result = getTransformationInfoFromTypeChange('object', 'number');
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('certain');
      });

      it('object to boolean', () => {
        const result = getTransformationInfoFromTypeChange('object', 'boolean');
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('certain');
      });

      it('string to object', () => {
        const result = getTransformationInfoFromTypeChange('string', 'object');
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('certain');
      });

      it('number to object', () => {
        const result = getTransformationInfoFromTypeChange('number', 'object');
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('certain');
      });

      it('boolean to object', () => {
        const result = getTransformationInfoFromTypeChange('boolean', 'object');
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('certain');
      });

      it('object to array', () => {
        const result = getTransformationInfoFromTypeChange('object', 'array');
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('certain');
      });

      it('array to object', () => {
        const result = getTransformationInfoFromTypeChange('array', 'object');
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('certain');
      });
    });

    describe('array conversions', () => {
      it('array to string - possible data loss', () => {
        const result = getTransformationInfoFromTypeChange('array', 'string');
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('possible');
      });

      it('array to number - possible data loss', () => {
        const result = getTransformationInfoFromTypeChange('array', 'number');
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('possible');
      });

      it('array to boolean - possible data loss', () => {
        const result = getTransformationInfoFromTypeChange('array', 'boolean');
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('possible');
      });

      it('string to array - no data loss (wrap)', () => {
        const result = getTransformationInfoFromTypeChange('string', 'array');
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('none');
      });

      it('number to array - no data loss (wrap)', () => {
        const result = getTransformationInfoFromTypeChange('number', 'array');
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('none');
      });

      it('boolean to array - no data loss (wrap)', () => {
        const result = getTransformationInfoFromTypeChange('boolean', 'array');
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('none');
      });
    });

    describe('typed array conversions', () => {
      it('string to array<string> - wrap with same type', () => {
        const result = getTransformationInfoFromTypeChange(
          'string',
          'array<string>',
        );
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('none');
        expect(result?.steps).toContainEqual({
          name: 'wrap in array',
          dataLossSeverity: 'none',
        });
      });

      it('number to array<string> - wrap with conversion', () => {
        const result = getTransformationInfoFromTypeChange(
          'number',
          'array<string>',
        );
        expect(result).not.toBeNull();
        expect(result?.steps.length).toBeGreaterThan(1);
      });

      it('array<number> to string - unwrap and convert', () => {
        const result = getTransformationInfoFromTypeChange(
          'array<number>',
          'string',
        );
        expect(result).not.toBeNull();
        expect(result?.steps).toContainEqual({
          name: 'unwrap array (first element)',
          dataLossSeverity: 'possible',
        });
      });

      it('array<string> to number - unwrap and convert', () => {
        const result = getTransformationInfoFromTypeChange(
          'array<string>',
          'number',
        );
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('possible');
      });

      it('array<boolean> to boolean - unwrap same type', () => {
        const result = getTransformationInfoFromTypeChange(
          'array<boolean>',
          'boolean',
        );
        expect(result).not.toBeNull();
        expect(result?.steps.length).toBe(1);
        expect(result?.steps[0]?.name).toBe('unwrap array (first element)');
      });
    });

    describe('fallback for unknown rules', () => {
      it('returns certain severity for unmapped conversions', () => {
        const result = getTransformationInfoFromTypeChange('ref', 'string');
        expect(result).not.toBeNull();
        expect(result?.dataLossSeverity).toBe('certain');
      });
    });
  });
});
