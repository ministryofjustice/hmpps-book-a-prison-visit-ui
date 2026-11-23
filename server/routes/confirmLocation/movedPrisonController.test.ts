import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { FlashData, appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import { createMockBookerService, createMockPrisonService } from '../../services/testutils/mocks'

let app: Express

const bookerService = createMockBookerService()
const prisonService = createMockPrisonService()
let sessionData: SessionData

const prisonNames = TestData.prisonNameDtos()
const prisoner = TestData.prisoner()

beforeEach(() => {
  prisoner.prisonId = 'DHI'
  sessionData = {
    booker: { reference: TestData.bookerReference().value },
    bookVisitJourney: {
      prisoner,
    },
  } as SessionData
  app = appWithAllRoutes({ services: { bookerService, prisonService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Confirm location', () => {
  describe(`GET ${paths.PRISONER_MOVED.CONFIRM_LOCATION}`, () => {
    let flashData: FlashData

    beforeEach(() => {
      flashData = {}
      flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])
    })

    it('should render confirm prison location page', () => {
      return request(app)
        .get(paths.PRISONER_MOVED.CONFIRM_LOCATION)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Prisoner has moved -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOK_VISIT.SELECT_PRISONER)
          expect($('h1').text().trim()).toBe('John Smith is no longer at Hewell (HMP & YOI)')

          expect($('form[method=POST]').attr('action')).toBe(paths.PRISONER_MOVED.CONFIRM_LOCATION)
          expect($('h2').text().trim()).toContain('Select the prisoner’s location')
          expect($('.govuk-hint').text().trim()).toContain('For example, Cardiff (HMP)')
          expect($('select#prisonId option').length).toBe(prisonNames.length + 1) // all prisons and default empty option
          expect($('select#prisonId option[value="HEI"]').text()).toBe('Hewell (HMP & YOI)')
          expect($('[data-test="find-prisoner-link"] a').attr('href')).toBe('https://www.gov.uk/find-prisoner')
          expect($('[data-test="continue-button"]').text().trim()).toBe('Continue')
        })
    })

    it('should redirect to visits home if prisoner has NOT moved location', () => {
      sessionData.bookVisitJourney!.prisoner.prisonId = 'HEI'
      return request(app).get(paths.PRISONER_MOVED.CONFIRM_LOCATION).expect(302).expect('location', paths.VISITS.HOME)
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
        .get(paths.PRISONER_MOVED.CONFIRM_LOCATION)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary a[href="#prisonId"]').text()).toBe('No prison selected')
          expect($('#prisonId-error').text()).toContain('No prison selected')
        })
    })
  })

  describe(`POST ${paths.PRISONER_MOVED.CONFIRM_LOCATION}`, () => {
    it('should redirect to prison updated page if correct prison is selected and prison is supported', () => {
      prisonService.isSupportedPrison.mockResolvedValue(true)
      return request(app)
        .post(paths.PRISONER_MOVED.CONFIRM_LOCATION)
        .send({ prisonId: 'DHI' })
        .expect(302)
        .expect('Location', paths.PRISONER_MOVED.LOCATION_UPDATED)
        .expect(() => {
          expect(sessionData.booker?.prisoners).toBeUndefined()
          expect(bookerService.updatePrisonersRegisteredPrison).toHaveBeenCalledWith({
            bookerReference: 'aaaa-bbbb-cccc',
            prisonerId: 'A1234BC',
            prisonId: 'DHI',
          })
        })
    })

    it('should redirect to incorrect location page if wrong prison is selected', () => {
      return request(app)
        .post(paths.PRISONER_MOVED.CONFIRM_LOCATION)
        .send({ prisonId: 'ABC' })
        .expect(302)
        .expect('Location', paths.PRISONER_MOVED.INCORRECT_LOCATION)
        .expect(() => {
          expect(bookerService.updatePrisonersRegisteredPrison).not.toHaveBeenCalled()
        })
    })

    it('should redirect to incorrect location page if an invalid prison code is entered', () => {
      return request(app)
        .post(paths.PRISONER_MOVED.CONFIRM_LOCATION)
        .send({ prisonId: 'TRN' })
        .expect(302)
        .expect('Location', paths.PRISONER_MOVED.INCORRECT_LOCATION)
        .expect(() => {
          expect(bookerService.updatePrisonersRegisteredPrison).not.toHaveBeenCalled()
        })
    })

    it('should redirect to unsupported prison page if correct prison is selected, but they do not use a digital service', () => {
      prisonService.isSupportedPrison.mockResolvedValue(false)
      sessionData.bookVisitJourney!.prisoner.prisonId = 'ACI'
      return request(app)
        .post(paths.PRISONER_MOVED.CONFIRM_LOCATION)
        .send({ prisonId: 'ACI' })
        .expect(302)
        .expect('Location', paths.PRISONER_MOVED.UNSUPPORTED_PRISON)
        .expect(() => {
          expect(sessionData.booker?.prisoners).toBeUndefined()
          expect(bookerService.updatePrisonersRegisteredPrison).toHaveBeenCalledWith({
            bookerReference: 'aaaa-bbbb-cccc',
            prisonerId: 'A1234BC',
            prisonId: 'ACI',
          })
        })
    })

    it('should redirect to PVB prison page if correct prison is selected, but they use PVB', () => {
      sessionData.bookVisitJourney!.prisoner.prisonId = 'CFI'
      return request(app)
        .post(paths.PRISONER_MOVED.CONFIRM_LOCATION)
        .send({ prisonId: 'CFI' })
        .expect(302)
        .expect('Location', paths.PRISONER_MOVED.PVB_PRISON)
        .expect(() => {
          expect(sessionData.booker?.prisoners).toBeUndefined()
          expect(bookerService.updatePrisonersRegisteredPrison).toHaveBeenCalledWith({
            bookerReference: 'aaaa-bbbb-cccc',
            prisonerId: 'A1234BC',
            prisonId: 'CFI',
          })
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
          .post(paths.PRISONER_MOVED.CONFIRM_LOCATION)
          .expect(302)
          .expect('Location', paths.PRISONER_MOVED.CONFIRM_LOCATION)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(sessionData.selectedPrison).toBeUndefined()
          })
      })
    })
  })
})
