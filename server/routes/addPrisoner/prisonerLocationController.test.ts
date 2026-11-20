import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { FlashData, appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import paths from '../../constants/paths'
import { AddPrisonerJourney } from '../../@types/bapv'

let app: Express
let sessionData: SessionData

beforeEach(() => {
  sessionData = {} as SessionData

  app = appWithAllRoutes({ sessionData })
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

    it('should render prisoner location page with list of supported prisons and clear any old session data', () => {
      sessionData.addPrisonerJourneyResult = {
        selectedPrisonId: 'some-prison-id',
        result: true,
        prisonerNumber: 'A1234BC',
      }

      return request(app)
        .get(paths.ADD_PRISONER.LOCATION)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Where is the prisoner you want to visit\? -/)
          expect($('#navigation').length).toBe(1)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.VISITS.HOME)
          expect($('h1').text().trim()).toBe('Where is the prisoner you want to visit?')

          expect($('form[method=POST]').attr('action')).toBe(paths.ADD_PRISONER.LOCATION)
          expect($('select[name=prisonId] option').length).toBe(6) // 5 prisons in TestData.prisonNames() plus default option
          expect($('select[name=prisonId] option:selected').text()).toBe('Select location') // default option

          expect($('[data-test="continue-button"]').text().trim()).toBe('Continue')

          expect(sessionData.addPrisonerJourneyResult).toBeUndefined()
        })
    })

    it('should pre-populate prison choice if selected prison set in session', () => {
      const selectedPrisonId = 'HEI'
      const prisonerDetails = { firstName: 'name' } as AddPrisonerJourney['prisonerDetails']
      sessionData.addPrisonerJourney = {
        selectedPrisonId,
        prisonerDetails,
      }

      return request(app)
        .get(paths.ADD_PRISONER.LOCATION)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('select[name=prisonId] option:selected').val()).toBe('HEI')
          expect($('select[name=prisonId] option:selected').text()).toBe('Hewell (HMP & YOI)')

          expect(sessionData.addPrisonerJourney).toStrictEqual<AddPrisonerJourney>({
            selectedPrisonId,
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
    beforeEach(() => {
      sessionData.addPrisonerJourney = {}
    })

    it('should save selected prison to session and redirect to prisoner details page', () => {
      const selectedPrisonId = 'HEI'

      return request(app)
        .post(paths.ADD_PRISONER.LOCATION)
        .send({ prisonId: selectedPrisonId })
        .expect(302)
        .expect('Location', paths.ADD_PRISONER.DETAILS)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.addPrisonerJourney!.selectedPrisonId).toBe(selectedPrisonId)
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
        return request(app)
          .post(paths.ADD_PRISONER.LOCATION)
          .expect(302)
          .expect('Location', paths.ADD_PRISONER.LOCATION)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(sessionData.addPrisonerJourney!.selectedPrisonId).toBeUndefined()
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
            expect(sessionData.addPrisonerJourney?.selectedPrisonId).toBeUndefined()
          })
      })

      it('should set a validation error and redirect to original page when invalid prisonId selected', () => {
        expectedFlashErrors[0].value = 'XYZ'

        return request(app)
          .post(paths.ADD_PRISONER.LOCATION)
          .send({ prisonId: 'XYZ' })
          .expect(302)
          .expect('Location', paths.ADD_PRISONER.LOCATION)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(sessionData.addPrisonerJourney!.selectedPrisonId).toBeUndefined()
          })
      })
    })
  })
})
