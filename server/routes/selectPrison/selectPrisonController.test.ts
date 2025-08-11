import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { FlashData, appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import { createMockPrisonService } from '../../services/testutils/mocks'
import { enableFeatureForTest } from '../../data/testutils/mockFeatureFlags'
import config from '../../config'

let app: Express
let sessionData: SessionData

const prisonNames = TestData.prisonNameDtos()
const prisonService = createMockPrisonService()

beforeEach(() => {
  enableFeatureForTest('visitRequest')

  sessionData = {} as SessionData
  prisonService.getAllPrisonNames.mockResolvedValue(prisonNames)

  app = appWithAllRoutes({ services: { prisonService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Select a prison', () => {
  describe(`GET ${paths.SELECT_PRISON}`, () => {
    let flashData: FlashData

    beforeEach(() => {
      flashData = {}
      flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])
    })

    it('should render select prison page with list of prisons and store supported prison in session', () => {
      sessionData.selectedPrisonId = 'HEI'

      return request(app)
        .get(paths.SELECT_PRISON)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Which prison are you visiting\? -/)
          expect($('#navigation').length).toBe(0)
          expect($('[data-test="back-link"]').attr('href')).toBe('https://www.gov.uk/prison-visits')
          expect($('h1').text().trim()).toBe('Which prison are you visiting?')

          expect($('form[method=POST]').attr('action')).toBe(paths.SELECT_PRISON)
          expect($('select#prisonId option').length).toBe(prisonNames.length + 1) // all prisons and default empty option
          expect($('select#prisonId option[value="HEI"]').text()).toBe('Hewell (HMP)')
          expect($('[data-test="continue-button"]').text().trim()).toBe('Continue')

          expect(sessionData.selectedPrisonId).toBeUndefined()
          expect(prisonService.getAllPrisonNames).toHaveBeenCalled()
        })
    })

    it('should render validation errors', () => {
      const validationError: FieldValidationError = {
        type: 'field',
        location: 'body',
        path: 'prisonId',
        value: [],
        msg: 'No prison selected',
      }

      flashData = { errors: [validationError] }

      return request(app)
        .get(paths.SELECT_PRISON)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary a[href="#prisonId-error"]').text()).toBe('No prison selected')
          expect($('#prisonId-error').text()).toContain('No prison selected')
        })
    })
  })

  describe(`POST ${paths.SELECT_PRISON}`, () => {
    it('should save selected prison to session and redirect to selected prison info page - supported prison', () => {
      const prisonId = 'HEI'
      prisonService.isSupportedPrison.mockResolvedValue(true)

      return request(app)
        .post(paths.SELECT_PRISON)
        .send({ prisonId })
        .expect(302)
        .expect('Location', paths.SELECTED_PRISON)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.selectedPrisonId).toBe(prisonId)
          expect(prisonService.isSupportedPrison).toHaveBeenCalledWith(prisonId)
        })
    })

    it('should not save selected prison to session and should redirect to PVB - unsupported prison', () => {
      const prisonId = 'HEI'
      prisonService.isSupportedPrison.mockResolvedValue(false)

      return request(app)
        .post(paths.SELECT_PRISON)
        .send({ prisonId })
        .expect(302)
        .expect('Location', config.pvbUrl)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.selectedPrisonId).toBeUndefined()
          expect(prisonService.isSupportedPrison).toHaveBeenCalledWith(prisonId)
        })
    })

    describe('Validation errors', () => {
      let expectedFlashErrors: FieldValidationError[]

      beforeEach(() => {
        expectedFlashErrors = [
          { type: 'field', location: 'body', path: 'prisonId', value: undefined, msg: 'No prison selected' },
        ]
      })

      it('should set a validation error and redirect to original page when no prison selected', () => {
        return request(app)
          .post(paths.SELECT_PRISON)
          .expect(302)
          .expect('Location', paths.SELECT_PRISON)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(sessionData.selectedPrisonId).toBeUndefined()
          })
      })
    })
  })
})
