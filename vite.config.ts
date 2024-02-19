import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  plugins: [
    dts(),
    tsconfigPaths(),
  ],
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'LibGaf',
      fileName: 'lib-gaf',
    },
  },
});
