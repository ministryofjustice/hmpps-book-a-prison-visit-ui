import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import paths from '../../constants/paths'
import config from '../../config'
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

describe('Prisoner not matched', () => {
  describe(`GET ${paths.ADD_PRISONER.FAIL}`, () => {
    it('should redirect to home page if add prisoner failure not set in session', () => {
      return request(app).get(paths.ADD_PRISONER.FAIL).expect(302).expect('Location', paths.RETURN_HOME)
    })

    it('should render prisoner details do not match page', () => {
      sessionData.addPrisonerJourney.result = false

      return request(app)
        .get(paths.ADD_PRISONER.FAIL)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Prisoner details do not match -/)
          expect($('#service-header__nav').length).toBe(0)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.ADD_PRISONER.DETAILS)
          expect($('h1').text()).toBe('Prisoner details do not match')
          expect($('[data-test=prison-name]').text()).toBe(selectedPrison.prisonName)
          expect($('[data-test=check-details]').attr('href')).toBe(paths.ADD_PRISONER.DETAILS)
        })
    })
  })
})
