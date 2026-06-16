import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    /**
     * Force l'utilisation de la BDD de test.
     * Sans ça, Prisma charge DATABASE_URL depuis .env
     * qui pointe vers geogsc_db (production).
     * La BDD test geogsc_test a toutes les migrations à jour.
     */
    env: {
      DATABASE_URL: 'postgresql://postgres:password@localhost:5432/geogsc_test'
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/']
    }
  }
})