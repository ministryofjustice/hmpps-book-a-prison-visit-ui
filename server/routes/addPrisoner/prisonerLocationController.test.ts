import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { FlashData, appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import config from '../../config'
import { createMockPrisonService } from '../../services/testutils/mocks'

let app: Express
let sessionData: SessionData

const prisons = [TestData.prisonRegisterPrisonDto()]
const prisonService = createMockPrisonService()

beforeEach(() => {
  jest.replaceProperty(config, 'features', {
    ...config.features,
    addPrisoner: true,
  })

  sessionData = {} as SessionData
  prisonService.getSupportedPrisons.mockResolvedValue(prisons)

  app = appWithAllRoutes({ services: { prisonService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Prisoner location', () => {
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

  describe(`GET ${paths.ADD_PRISONER.LOCATION}`, () => {
    let flashData: FlashData

    beforeEach(() => {
      flashData = {}
      flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])
    })

    it('should render prisoner location page with list of supported prisons and store supported prison IDs in session', () => {
      return request(app)
        .get(paths.ADD_PRISONER.LOCATION)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Where is the prisoner you want to visit?\? -/)
          expect($('#service-header__nav').length).toBe(0)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.HOME)
          expect($('h1').text().trim()).toBe('Where is the prisoner you want to visit?')

          expect($('input[name=prisons]').length).toBe(1)
          expect($('label[for=prisons]').eq(0).text().trim()).toBe('Hewell (HMP)')
          expect($('input[name=prisons]').eq(0).val()).toBe('HEI')
          expect($('form[method=POST]').attr('action')).toBe(paths.ADD_PRISONER.LOCATION)
          expect($('[data-test="continue-button"]').text().trim()).toBe('Continue')

          expect(sessionData.addPrisonerJourney.supportedPrisonIds).toStrictEqual(['HEI'])
        })
    })

    it('should render validation errors', () => {
      const validationError: FieldValidationError = {
        type: 'field',
        location: 'body',
        path: 'prisons',
        value: [],
        msg: 'Select a prison',
      }

      flashData = { errors: [validationError] }

      return request(app)
        .get(paths.ADD_PRISONER.LOCATION)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary a[href="#prisons-error"]').text()).toBe('Select a prison')
          expect($('#prisons-error').text()).toContain('Select a prison')
        })
    })
  })
})
