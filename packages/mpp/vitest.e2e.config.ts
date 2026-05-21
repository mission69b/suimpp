import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/e2e/**/*.test.ts'],
    setupFiles: ['test/e2e/setupEnv.ts'],
    globalSetup: ['test/e2e/globalSetup.ts'],
    hookTimeout: 600_000,
    testTimeout: 120_000,
  },
});
