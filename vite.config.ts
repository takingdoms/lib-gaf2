import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  plugins: [
    dts(),
  ],
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'LibGaf',
      fileName: 'lib-gaf',
    },
  },
});
