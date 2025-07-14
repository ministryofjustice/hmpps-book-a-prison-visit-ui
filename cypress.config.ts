import { defineConfig } from 'cypress'
import { resetStubs } from './integration_tests/mockApis/wiremock'
import hmppsAuth from './integration_tests/mockApis/hmppsAuth'
import govukOneLogin from './integration_tests/mockApis/govukOneLogin'
import pvb from './integration_tests/mockApis/pvb'
import redisHelpers from './integration_tests/redis/redisHelpers'
import orchestrationService from './integration_tests/mockApis/orchestration'
import prisonRegister from './integration_tests/mockApis/prisonRegister'

export default defineConfig({
  chromeWebSecurity: false,
  fixturesFolder: 'integration_tests/fixtures',
  screenshotsFolder: 'integration_tests/screenshots',
  videosFolder: 'integration_tests/videos',
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  taskTimeout: 60000,
  viewportHeight: 1400,
  e2e: {
    setupNodeEvents(on) {
      on('task', {
        reset: () => Promise.all([redisHelpers.clearDataCache(), resetStubs()]),
        ...hmppsAuth,
        ...govukOneLogin,
        ...redisHelpers,
        ...orchestrationService,
        ...prisonRegister,
        ...pvb,

        // Log message to console
        log: (message: string) => {
          // eslint-disable-next-line no-console
          console.log(message)
          return null
        },

        // Log table to console
        table: (violationData: Record<string, string>[]) => {
          // eslint-disable-next-line no-console
          console.table(violationData)
          return null
        },
      })
    },
    baseUrl: 'http://localhost:3007',
    excludeSpecPattern: '**/!(*.cy).ts',
    specPattern: 'integration_tests/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'integration_tests/support/index.ts',
  },
})
