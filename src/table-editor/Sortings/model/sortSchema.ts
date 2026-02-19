import { arr, obj, str } from '@revisium/schema-toolkit';

export const SORT_SCHEMA = arr(
  obj({
    field: str(),
    direction: str(),
  }),
);
