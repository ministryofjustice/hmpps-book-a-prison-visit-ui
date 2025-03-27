import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { FlashData, FlashErrors, appWithAllRoutes, flashProvider } from '../testutils/appSetup'
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

          expect($('input[name=prisonId]').length).toBe(1)
          expect($('label[for=prisonId]').eq(0).text().trim()).toBe('Hewell (HMP)')
          expect($('input[name=prisonId]').eq(0).val()).toBe('HEI')
          expect($('form[method=POST]').attr('action')).toBe(paths.ADD_PRISONER.LOCATION)
          expect($('[data-test="continue-button"]').text().trim()).toBe('Continue')

          expect(sessionData.addPrisonerJourney.supportedPrisonIds).toStrictEqual(['HEI'])
        })
    })

    it('should render validation errors', () => {
      const validationError: FieldValidationError = {
        type: 'field',
        location: 'body',
        path: 'prisonId',
        value: [],
        msg: 'Select a prison',
      }

      flashData = { errors: [validationError] }

      return request(app)
        .get(paths.ADD_PRISONER.LOCATION)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary a[href="#prisonId-error"]').text()).toBe('Select a prison')
          expect($('#prisonId-error').text()).toContain('Select a prison')
        })
    })
  })

  describe(`POST ${paths.ADD_PRISONER.LOCATION}`, () => {
    it('should save selected prison to session and redirect to prisoner details page', () => {
      sessionData.addPrisonerJourney = { supportedPrisonIds: ['HEI'] }

      return request(app)
        .post(paths.ADD_PRISONER.LOCATION)
        .send({ prisonId: 'HEI' })
        .expect(302)
        .expect('Location', paths.ADD_PRISONER.DETAILS)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.addPrisonerJourney.selectedPrisonId).toBe('HEI')
        })
    })

    describe('Validation errors', () => {
      let expectedFlashErrors: FlashErrors

      beforeEach(() => {
        expectedFlashErrors = [
          { type: 'field', location: 'body', path: 'prisonId', value: undefined, msg: 'Select a prison' },
        ]
      })

      it('should set a validation error and redirect to original page when no prison selected', () => {
        sessionData.addPrisonerJourney = { supportedPrisonIds: ['HEI'] }

        return request(app)
          .post(paths.ADD_PRISONER.LOCATION)
          .expect(302)
          .expect('Location', paths.ADD_PRISONER.LOCATION)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(sessionData.addPrisonerJourney.selectedPrisonId).toBeUndefined()
          })
      })

      it('should set a validation error and redirect to original page when if supported prison IDs not set', () => {
        sessionData.addPrisonerJourney = undefined

        return request(app)
          .post(paths.ADD_PRISONER.LOCATION)
          .expect(302)
          .expect('Location', paths.ADD_PRISONER.LOCATION)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(sessionData.addPrisonerJourney?.selectedPrisonId).toBeUndefined()
          })
      })

      it('should set a validation error and redirect to original page when invalid prisonId selected', () => {
        sessionData.addPrisonerJourney = { supportedPrisonIds: ['HEI'] }
        expectedFlashErrors[0].value = 'XYZ'

        return request(app)
          .post(paths.ADD_PRISONER.LOCATION)
          .send({ prisonId: 'XYZ' })
          .expect(302)
          .expect('Location', paths.ADD_PRISONER.LOCATION)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(sessionData.addPrisonerJourney.selectedPrisonId).toBeUndefined()
          })
      })
    })
  })
})
