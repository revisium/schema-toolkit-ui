import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  inlineOnly: false,
  external: [
    'react',
    'react-dom',
    '@chakra-ui/react',
    '@emotion/react',
    'next-themes',
    'mobx',
    'mobx-react-lite',
    '@atlaskit/drag-and-drop',
    '@codemirror/lang-json',
    '@uiw/codemirror-theme-github',
    '@uiw/react-codemirror',
    'react-icons',
    'react-use',
  ],
});
