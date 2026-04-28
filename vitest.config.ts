import { defineVitestConfig } from '@nuxt/test-utils/config'
export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    poolOptions: {
      forks: {
        maxForks: 2,
      },
    },
  },
})
