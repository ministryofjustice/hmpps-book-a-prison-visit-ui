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

beforeEach(() => {
  const prisoner = TestData.prisoner({ prisonId: 'DHI' })
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

    it('should redirect to visits home if there is no bookVisitJourney in the session', () => {
      delete sessionData.bookVisitJourney
      return request(app).get(paths.PRISONER_MOVED.CONFIRM_LOCATION).expect(302).expect('location', paths.VISITS.HOME)
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

    it('should redirect to visits home if there is no bookVisitJourney in the session', () => {
      delete sessionData.bookVisitJourney
      return request(app)
        .post(paths.PRISONER_MOVED.CONFIRM_LOCATION)
        .send({ prisonId: 'DHI' })
        .expect(302)
        .expect('Location', paths.VISITS.HOME)
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

    describe('GET - Prisoner moved location updated page', () => {
      beforeEach(() => {
        const prisoner1 = TestData.prisoner({ prisonId: 'DHI' })
        const registeredPrisoner = TestData.prisoner({ prisonId: 'DHI', registeredPrisonId: 'DHI' })

        sessionData = {
          booker: { reference: TestData.bookerReference().value, prisoners: [registeredPrisoner] },
          bookVisitJourney: {
            prisoner: prisoner1,
          },
          confirmLocationSelectedPrison: 'DHI',
        } as SessionData
        app = appWithAllRoutes({ services: { bookerService, prisonService }, sessionData })
      })

      it('should redirect to the visits page if there is no bookVisitJourney', () => {
        delete sessionData.bookVisitJourney
        return request(app).get(paths.PRISONER_MOVED.LOCATION_UPDATED).expect(302).expect('Location', paths.VISITS.HOME)
      })

      it('should render the location updated page for the first prisoner', () => {
        return request(app)
          .get(paths.PRISONER_MOVED.LOCATION_UPDATED)
          .expect(200)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('title').text()).toMatch(/^Prisoner’s location updated -/)
            expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOK_VISIT.SELECT_PRISONER)
            expect($('h1').text().trim()).toBe('John Smith is at Drake Hall (HMP & YOI)')
            expect($('[data-test="continue"]').length).toBe(1)
            expect($('[data-test="continue"]').text().trim()).toBe('Continue')
            expect(sessionData.bookVisitJourney?.prisoner.registeredPrisonId).toBe('DHI')
          })
      })
    })

    describe(`GET ${paths.PRISONER_MOVED.INCORRECT_LOCATION}`, () => {
      beforeEach(() => {
        const prisoner1 = TestData.prisoner({ prisonId: 'DHI' })
        const prisoner2 = TestData.prisoner({
          prisonerNumber: 'B2345DC',
          firstName: 'Bob',
          registeredPrisonId: 'DHI',
        })

        const registeredPrisoner = TestData.prisoner({
          prisonerNumber: 'B2345DC',
          firstName: 'Bob',
          prisonId: 'ACI',
          registeredPrisonId: 'ACI',
        })
        sessionData = {
          booker: { reference: TestData.bookerReference().value, prisoners: [prisoner1, registeredPrisoner] },
          bookVisitJourney: {
            prisoner: prisoner2,
          },
          confirmLocationSelectedPrison: 'DHI',
        } as SessionData
        app = appWithAllRoutes({ services: { bookerService, prisonService }, sessionData })
      })

      it('should render the incorrect location page for the second prisoner', () => {
        return request(app)
          .get(paths.PRISONER_MOVED.INCORRECT_LOCATION)
          .expect(200)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('title').text()).toMatch(/^Prisoner is not at this prison -/)
            expect($('[data-test="back-link"]').attr('href')).toBe(paths.PRISONER_MOVED.CONFIRM_LOCATION)
            expect($('h1').text().trim()).toBe('Bob Smith is not at Drake Hall (HMP & YOI)')
            expect(sessionData.bookVisitJourney?.prisoner.registeredPrisonId).toBe('DHI')
          })
      })
    })

    describe(`GET ${paths.PRISONER_MOVED.PVB_PRISON}`, () => {
      beforeEach(() => {
        const prisoner1 = TestData.prisoner({ prisonId: 'CFI' })
        const registeredPrisoner = TestData.prisoner({ prisonId: 'CFI', registeredPrisonId: 'CFI' })
        sessionData = {
          booker: { reference: TestData.bookerReference().value, prisoners: [registeredPrisoner] },
          bookVisitJourney: {
            prisoner: prisoner1,
          },
          confirmLocationSelectedPrison: 'CFI',
        } as SessionData
        app = appWithAllRoutes({ services: { bookerService, prisonService }, sessionData })
      })

      it('should redirect to the visits page if confirmLocationSelectedPrison is not in the session', () => {
        delete sessionData.confirmLocationSelectedPrison
        return request(app).get(paths.PRISONER_MOVED.PVB_PRISON).expect(302).expect('Location', paths.VISITS.HOME)
      })

      it('should render the pvb prison page', () => {
        return request(app)
          .get(paths.PRISONER_MOVED.PVB_PRISON)
          .expect(200)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('title').text()).toMatch(/^Prisoner’s new location uses another service -/)
            expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOK_VISIT.SELECT_PRISONER)
            expect($('h1').text().trim()).toBe('Cardiff (HMP & YOI) does not use this service')
            expect(sessionData.bookVisitJourney?.prisoner.registeredPrisonId).toBe('CFI')
          })
      })
    })

    describe(`GET ${paths.PRISONER_MOVED.UNSUPPORTED_PRISON}`, () => {
      beforeEach(() => {
        const prisoner1 = TestData.prisoner({ prisonId: 'DHI' })
        const prisoner2 = TestData.prisoner({
          prisonerNumber: 'B2345DC',
          firstName: 'Bob',
          prisonId: 'ACI',
        })

        const registeredPrisoner = TestData.prisoner({
          prisonerNumber: 'B2345DC',
          firstName: 'Bob',
          prisonId: 'ACI',
          registeredPrisonId: 'ACI',
        })
        sessionData = {
          booker: { reference: TestData.bookerReference().value, prisoners: [prisoner1, registeredPrisoner] },
          bookVisitJourney: {
            prisoner: prisoner2,
          },
          confirmLocationSelectedPrison: 'ACI',
        } as SessionData
        app = appWithAllRoutes({ services: { bookerService, prisonService }, sessionData })
      })
      it('should render the unsupported prison page', () => {
        return request(app)
          .get(paths.PRISONER_MOVED.UNSUPPORTED_PRISON)
          .expect(200)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('title').text()).toMatch(/^Prisoner’s new location does not use this service -/)
            expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOK_VISIT.SELECT_PRISONER)
            expect($('h1').text().trim()).toBe('You cannot book visits to Altcourse (HMP & YOI) using this service')
            expect(sessionData.bookVisitJourney?.prisoner.registeredPrisonId).toBe('ACI')
          })
      })

      it('should redirect to visits home if the prisoner is not in booker prisoners', () => {
        sessionData.booker!.prisoners = []
        return request(app)
          .get(paths.PRISONER_MOVED.UNSUPPORTED_PRISON)
          .expect(302)
          .expect('Location', paths.VISITS.HOME)
      })
    })
  })
})
