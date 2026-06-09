import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/interfaces/__tests__/**/*.test.ts'],
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true }
    },
    // Force DATABASE_URL vers la BDD de test
    // Cette variable sera lue par infrastructure/prisma.ts
    env: {
      DATABASE_URL: 'postgresql://postgres:password@localhost:5432/geogsc_test',
      DATABASE_TEST_URL: 'postgresql://postgres:password@localhost:5432/geogsc_test',
      JWT_SECRET: 'test-secret',
      NODE_ENV: 'test'
    }
  }
})