import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  deps: {
    // need to bundle dependencies because they are
    // not available when run inside the action
    alwaysBundle: ['@actions/core', '@actions/tool-cache', 'zod'],
  },
  dts: false,
  entry: {
    main: 'src/main.ts',
  },
  format: 'esm',
  minify: false,
  sourcemap: true,
  target: 'es2024',
});
