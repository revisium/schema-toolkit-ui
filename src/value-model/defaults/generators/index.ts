import type { DefaultValueGeneratorFn } from '../types';

export const stringDefaultGenerator: DefaultValueGeneratorFn = () => '';

export const numberDefaultGenerator: DefaultValueGeneratorFn = () => 0;

export const booleanDefaultGenerator: DefaultValueGeneratorFn = () => false;

export const arrayDefaultGenerator: DefaultValueGeneratorFn = () => [];

export const objectDefaultGenerator: DefaultValueGeneratorFn = () => ({});

export const uuidDefaultGenerator: DefaultValueGeneratorFn = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replaceAll(/[xy]/g, (c) => {
    const r = Math.trunc(Math.random() * 16); // eslint-disable-line sonarjs/pseudo-random
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const timestampDefaultGenerator: DefaultValueGeneratorFn = () => {
  return new Date().toISOString();
};

export const fileDefaultGenerator: DefaultValueGeneratorFn = () => ({
  fileId: '',
  url: '',
  status: 'ready',
});
