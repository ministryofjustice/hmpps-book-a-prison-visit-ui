import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import paths from '../../constants/paths'
import TestData from '../testutils/testData'

let app: Express
let sessionData: SessionData

const selectedPrison = TestData.prisonRegisterPrisonDto()
const supportedPrisons = [selectedPrison]

beforeEach(() => {
  sessionData = { addPrisonerJourney: { supportedPrisons, selectedPrison } } as SessionData

  app = appWithAllRoutes({ sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Prisoner added', () => {
  describe(`GET ${paths.ADD_PRISONER.SUCCESS}`, () => {
    it('should redirect to home page if add prisoner success not set in session', () => {
      return request(app).get(paths.ADD_PRISONER.SUCCESS).expect(302).expect('Location', paths.RETURN_HOME)
    })

    it('should clear add prisoner journey session data and render the success page', () => {
      sessionData.addPrisonerJourney.result = true

      return request(app)
        .get(paths.ADD_PRISONER.SUCCESS)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Prisoner added -/)
          expect($('#navigation').length).toBe(1)
          expect($('[data-test="back-link"]').length).toBe(0)
          expect($('h1').text().trim()).toBe('Prisoner added')
          expect(sessionData.addPrisonerJourney).toBeUndefined()
        })
    })
  })
})
