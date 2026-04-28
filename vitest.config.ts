import { defineVitestConfig } from '@nuxt/test-utils/config'
export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    forks: {
      maxForks: 2,
    },
  },
})
