import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  dts: false,
  entry: {
    main: 'src/main.ts',
  },
  format: 'esm',
  inlineOnly: false,
  minify: false,
  // need to bundle dependencies because they are
  // not available when run inside the action
  noExternal: ['@actions/core', '@actions/tool-cache', 'zod'],
  sourcemap: true,
  target: 'es2024',
});
