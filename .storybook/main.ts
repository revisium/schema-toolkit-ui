import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  refs: {
    '@chakra-ui/react': {
      disable: true,
    },
  },

  addons: ['@storybook/addon-vitest'],
};

export default config;
