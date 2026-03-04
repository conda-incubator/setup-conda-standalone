import {
  coverageConfigDefaults,
  defaultExclude,
  defineConfig,
} from 'vitest/config';

const ci = !!process.env.CI;

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      exclude: [...coverageConfigDefaults.exclude, 'src/main.ts'],
      provider: 'v8',
      reporter: ci ? ['text', 'json-summary'] : ['text', 'html'],
    },
    exclude: [...defaultExclude],
    globals: true,
    reporters: ci ? ['tree', 'github-actions'] : ['tree'],
  },
});
