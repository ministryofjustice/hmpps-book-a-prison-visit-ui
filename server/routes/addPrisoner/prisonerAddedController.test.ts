import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import paths from '../../constants/paths'
import config from '../../config'

let app: Express
let sessionData: SessionData

const prisonId = 'HEI'

beforeEach(() => {
  jest.replaceProperty(config, 'features', {
    ...config.features,
    addPrisoner: true,
  })

  sessionData = { addPrisonerJourney: { supportedPrisonIds: [prisonId], selectedPrisonId: prisonId } } as SessionData

  app = appWithAllRoutes({ sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Prisoner added', () => {
  describe('Feature flag', () => {
    it('should not be available if feature flag disabled', () => {
      jest.replaceProperty(config, 'features', {
        ...config.features,
        addPrisoner: false,
      })
      app = appWithAllRoutes({})
      return request(app).get(paths.ADD_PRISONER.LOCATION).expect(404)
    })
  })

  describe(`GET ${paths.ADD_PRISONER.SUCCESS}`, () => {
    it('should redirect to home page if add prisoner success not set in session', () => {
      return request(app).get(paths.ADD_PRISONER.SUCCESS).expect(302).expect('Location', paths.HOME)
    })

    it('should clear add prisoner journey session data and render the success page', () => {
      sessionData.addPrisonerJourney.result = true

      return request(app)
        .get(paths.ADD_PRISONER.SUCCESS)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Prisoner added -/)
          expect($('#service-header__nav').length).toBe(0)
          expect($('[data-test="back-link"]').length).toBe(0)
          expect($('h1').text().trim()).toBe('Prisoner added')
          expect(sessionData.addPrisonerJourney).toBeUndefined()
        })
    })
  })
})
