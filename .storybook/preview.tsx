import type { Preview } from '@storybook/react';
import * as mobx from 'mobx';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { ThemeProvider } from 'next-themes';
import {
  setReactivityProvider,
  createMobxProvider,
} from '@revisium/schema-toolkit/core';

// Initialize MobX reactivity for schema-toolkit
setReactivityProvider(createMobxProvider(mobx));

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <ChakraProvider value={defaultSystem}>
        <ThemeProvider attribute="class" disableTransitionOnChange>
          <Story />
        </ThemeProvider>
      </ChakraProvider>
    ),
  ],
};

export default preview;
