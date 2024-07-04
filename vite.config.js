import path from 'path';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'vite';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
      '@tests': path.join(__dirname, 'tests'),
    },
  },
  server: {
    port: 8001,
  },
  build: {
    modulePreload: false,
    minify: true,
    lib: {
      entry: 'src/index.ts',
      name: 'fastschema',
      fileName: 'fastschema',
      formats: ['es', 'cjs', 'umd'],
    },
    rollupOptions: {
      plugins: [
        typescript({
          declaration: true,
          declarationDir: 'dist/types',
        }),
        isProduction && terser({
          keep_classnames: true,
          keep_fnames: true,
          output: {
            comments: false,
          },
        }),
      ],
      output: {
        exports: 'named',
      }
    },
  },
  test: {
    fileParallelism: false,
    coverage: {
      cleanOnRerun: true,
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', ['html']],
    },
  },
});
