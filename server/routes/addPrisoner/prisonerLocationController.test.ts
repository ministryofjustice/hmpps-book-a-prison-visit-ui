import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { FlashData, appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import { createMockPrisonService } from '../../services/testutils/mocks'
import { AddPrisonerJourney } from '../../@types/bapv'
import { PrisonRegisterPrisonDto } from '../../data/orchestrationApiTypes'

let app: Express
let sessionData: SessionData

const supportedPrisons = [TestData.prisonRegisterPrisonDto()]
const prisonService = createMockPrisonService()

beforeEach(() => {
  sessionData = {} as SessionData
  prisonService.getSupportedPrisons.mockResolvedValue(supportedPrisons)

  app = appWithAllRoutes({ services: { prisonService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Prisoner location', () => {
  describe(`GET ${paths.ADD_PRISONER.LOCATION}`, () => {
    let flashData: FlashData

    beforeEach(() => {
      flashData = {}
      flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])
    })

    it('should render prisoner location page with list of supported prisons and store supported prison in session', () => {
      return request(app)
        .get(paths.ADD_PRISONER.LOCATION)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Where is the prisoner you want to visit\? -/)
          expect($('#navigation').length).toBe(1)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.HOME)
          expect($('h1').text().trim()).toBe('Where is the prisoner you want to visit?')

          expect($('form[method=POST]').attr('action')).toBe(paths.ADD_PRISONER.LOCATION)
          expect($('input[name=prisonId]').length).toBe(1)
          expect($('input[name=prisonId]:checked').length).toBe(0)
          expect($('label[for=prisonId]').eq(0).text().trim()).toBe('Hewell (HMP)')
          expect($('input[name=prisonId]').eq(0).val()).toBe('HEI')
          expect($('[data-test="continue-button"]').text().trim()).toBe('Continue')

          expect(sessionData.addPrisonerJourney.supportedPrisons).toStrictEqual<PrisonRegisterPrisonDto[]>(
            supportedPrisons,
          )
        })
    })

    it('should pre-populate prison choice if selected prison set in session', () => {
      const selectedPrison = TestData.prisonRegisterPrisonDto()
      const prisonerDetails = { firstName: 'name' } as AddPrisonerJourney['prisonerDetails']
      sessionData.addPrisonerJourney = {
        supportedPrisons: undefined,
        selectedPrison,
        prisonerDetails,
      }

      return request(app)
        .get(paths.ADD_PRISONER.LOCATION)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input[name=prisonId]').length).toBe(1)
          expect($('input[name=prisonId]:checked').length).toBe(1)
          expect($('input[name=prisonId]').eq(0).val()).toBe('HEI')

          expect(sessionData.addPrisonerJourney).toStrictEqual<AddPrisonerJourney>({
            supportedPrisons,
            selectedPrison,
            prisonerDetails,
          })
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
          expect($('.govuk-error-summary a[href="#prisonId"]').text()).toBe('Select a prison')
          expect($('#prisonId-error').text()).toContain('Select a prison')
        })
    })
  })

  describe(`POST ${paths.ADD_PRISONER.LOCATION}`, () => {
    it('should save selected prison to session and redirect to prisoner details page', () => {
      sessionData.addPrisonerJourney = { supportedPrisons }
      const selectedPrison = TestData.prisonRegisterPrisonDto()

      return request(app)
        .post(paths.ADD_PRISONER.LOCATION)
        .send({ prisonId: selectedPrison.prisonId })
        .expect(302)
        .expect('Location', paths.ADD_PRISONER.DETAILS)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.addPrisonerJourney.selectedPrison).toStrictEqual(selectedPrison)
        })
    })

    describe('Validation errors', () => {
      let expectedFlashErrors: FieldValidationError[]

      beforeEach(() => {
        expectedFlashErrors = [
          { type: 'field', location: 'body', path: 'prisonId', value: undefined, msg: 'Select a prison' },
        ]
      })

      it('should set a validation error and redirect to original page when no prison selected', () => {
        sessionData.addPrisonerJourney = { supportedPrisons }

        return request(app)
          .post(paths.ADD_PRISONER.LOCATION)
          .expect(302)
          .expect('Location', paths.ADD_PRISONER.LOCATION)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(sessionData.addPrisonerJourney.selectedPrison).toBeUndefined()
          })
      })

      it('should set a validation error and redirect to original page if supported prisons not set', () => {
        sessionData.addPrisonerJourney = undefined

        return request(app)
          .post(paths.ADD_PRISONER.LOCATION)
          .expect(302)
          .expect('Location', paths.ADD_PRISONER.LOCATION)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(sessionData.addPrisonerJourney?.selectedPrison).toBeUndefined()
          })
      })

      it('should set a validation error and redirect to original page when invalid prisonId selected', () => {
        sessionData.addPrisonerJourney = { supportedPrisons }
        expectedFlashErrors[0].value = 'XYZ'

        return request(app)
          .post(paths.ADD_PRISONER.LOCATION)
          .send({ prisonId: 'XYZ' })
          .expect(302)
          .expect('Location', paths.ADD_PRISONER.LOCATION)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(sessionData.addPrisonerJourney.selectedPrison).toBeUndefined()
          })
      })
    })
  })
})
