import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { FlashData, appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import { createMockVisitService } from '../../services/testutils/mocks'
import paths from '../../constants/paths'
import logger from '../../../logger'
import { SessionRestriction } from '../../data/orchestrationApiClient'
import { FlashFormValues } from '../../@types/bapv'

jest.mock('../../../logger')

let app: Express

const visitService = createMockVisitService()
let sessionData: SessionData

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner()
const prison = TestData.prisonDto()
const sessionRestriction: SessionRestriction = 'OPEN'
const adultVisitor1 = TestData.visitor({ visitorDisplayId: 'uuidv4-1', visitorId: 100 })
const adultVisitor2 = TestData.visitor({ visitorDisplayId: 'uuidv4-2', visitorId: 200 })
const childVisitor = TestData.visitor({
  visitorDisplayId: 'uuidv4-3',
  visitorId: 300,
  dateOfBirth: `${new Date().getFullYear() - 2}-01-01`,
  adult: false,
})
const visitSession = TestData.availableVisitSessionDto()

beforeEach(() => {
  sessionData = {
    booker: { reference: bookerReference, prisoners: [prisoner] },
    bookingJourney: {
      prisoner,
      prison,
      eligibleVisitors: [adultVisitor1, adultVisitor2, childVisitor],
      selectedVisitors: [adultVisitor1, childVisitor],
      sessionRestriction,
      allVisitSessionIds: ['2024-05-30_a'],
      allVisitSessions: [visitSession],
      selectedVisitSession: visitSession,
      applicationReference: TestData.applicationDto().reference,
      visitorSupport: '',
      mainContact: adultVisitor1,
    },
  } as SessionData

  app = appWithAllRoutes({ sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Contact details', () => {
  describe(`GET ${paths.BOOK_VISIT.CONTACT_DETAILS}`, () => {
    let flashData: FlashData

    beforeEach(() => {
      flashData = {}
      flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])
    })

    it('should use the session validation middleware', () => {
      sessionData.bookingJourney.prisoner = undefined

      return request(app)
        .get(paths.BOOK_VISIT.CONTACT_DETAILS)
        .expect(302)
        .expect('Location', paths.HOME)
        .expect(res => {
          expect(logger.info).toHaveBeenCalledWith(expect.stringMatching('Session validation failed'))
        })
    })

    it('should render contact details page for selected main contact and all fields empty', () => {
      return request(app)
        .get(paths.BOOK_VISIT.CONTACT_DETAILS)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Contact details -/)
          expect($('#navigation').length).toBe(0)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOK_VISIT.MAIN_CONTACT)
          expect($('h1').text().trim()).toBe(`Contact details for ${adultVisitor1.firstName} ${adultVisitor1.lastName}`)

          expect($('form[method=POST]').attr('action')).toBe(paths.BOOK_VISIT.CONTACT_DETAILS)

          expect($('input[name=getUpdatesBy]:checked').length).toBe(0)
          expect($('input[name=mainContactEmail]').prop('value')).toBeFalsy()
          expect($('input[name=mainContactPhone]').prop('value')).toBeFalsy()
        })
    })

    it('should pre-populate with data in session', () => {
      sessionData.bookingJourney.mainContactEmail = 'user@example.com'
      sessionData.bookingJourney.mainContactPhone = '07712 000 000'

      return request(app)
        .get(paths.BOOK_VISIT.CONTACT_DETAILS)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input[name=getUpdatesBy]:checked').length).toBe(2)
          expect($('input[name=mainContactEmail]').prop('value')).toBe('user@example.com')
          expect($('input[name=mainContactPhone]').prop('value')).toBe('07712 000 000')
        })
    })

    it('should pre-populate with data in formValues overriding that in session', () => {
      sessionData.bookingJourney.mainContactEmail = 'user@example.com'
      sessionData.bookingJourney.mainContactPhone = '07712 000 000'
      const formValues = { getUpdatesBy: ['email'], mainContactEmail: 'new-email', mainContactPhone: '' }
      flashData = { formValues: [formValues] }

      return request(app)
        .get(paths.BOOK_VISIT.CONTACT_DETAILS)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input[name=getUpdatesBy]:checked').length).toBe(1)
          expect($('input[name=mainContactEmail]').prop('value')).toBe('new-email')
          expect($('input[name=mainContactPhone]').prop('value')).toBeFalsy()
        })
    })

    it('should render validation errors', () => {
      const validationErrors: FieldValidationError[] = [
        { location: 'body', msg: 'Enter a valid email', path: 'mainContactEmail', type: 'field', value: undefined },
        { location: 'body', msg: 'Enter a phone number', path: 'mainContactPhone', type: 'field', value: undefined },
      ]
      flashData = { errors: validationErrors }

      return request(app)
        .get(paths.BOOK_VISIT.CONTACT_DETAILS)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Error: Contact details -/)
          expect($('.govuk-error-summary a[href=#mainContactEmail-error]').text()).toBe('Enter a valid email')
          expect($('.govuk-error-summary a[href=#mainContactPhone-error]').text()).toBe('Enter a phone number')
          expect($('#mainContactEmail-error').text()).toContain('Enter a valid email')
          expect($('#mainContactPhone-error').text()).toContain('Enter a phone number')
        })
    })
  })

  describe(`POST ${paths.BOOK_VISIT.CONTACT_DETAILS}`, () => {
    const application = TestData.applicationDto()

    beforeEach(() => {
      visitService.changeVisitApplication.mockResolvedValue(application)

      app = appWithAllRoutes({ services: { visitService }, sessionData })
    })

    it('should save new email and phone number to session, update application and redirect to check visit details page', () => {
      sessionData.bookingJourney.mainContactEmail = 'existing-email'
      sessionData.bookingJourney.mainContactPhone = 'existing-phone'

      return request(app)
        .post(paths.BOOK_VISIT.CONTACT_DETAILS)
        .send({
          getUpdatesBy: ['email', 'phone'],
          mainContactEmail: 'user@example.com',
          mainContactPhone: '07712 000 000',
        })
        .expect(302)
        .expect('location', paths.BOOK_VISIT.CHECK_DETAILS)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.bookingJourney.mainContactEmail).toBe('user@example.com')
          expect(sessionData.bookingJourney.mainContactPhone).toBe('07712 000 000')

          expect(visitService.changeVisitApplication).toHaveBeenCalledWith({
            bookingJourney: sessionData.bookingJourney,
          })
        })
    })

    it('should clear existing email and phone from session when not checked, update application and redirect to check visit details page', () => {
      sessionData.bookingJourney.mainContactEmail = 'existing-email'
      sessionData.bookingJourney.mainContactPhone = 'existing-phone'

      return request(app)
        .post(paths.BOOK_VISIT.CONTACT_DETAILS)
        .send({
          getUpdatesBy: [],
          mainContactEmail: 'user@example.com',
          mainContactPhone: '07712 000 000',
        })
        .expect(302)
        .expect('location', paths.BOOK_VISIT.CHECK_DETAILS)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.bookingJourney.mainContactEmail).toBeUndefined()
          expect(sessionData.bookingJourney.mainContactPhone).toBeUndefined()

          expect(visitService.changeVisitApplication).toHaveBeenCalledWith({
            bookingJourney: sessionData.bookingJourney,
          })
        })
    })

    describe('Validation errors', () => {
      let expectedFlashErrors: FieldValidationError[]
      let expectedFlashFormValues: FlashFormValues

      it('should set validation errors when email and phone checked but no data entered', () => {
        expectedFlashErrors = [
          {
            type: 'field',
            location: 'body',
            path: 'mainContactEmail',
            value: 'invalid-email',
            msg: 'Enter a valid email address',
          },
          {
            type: 'field',
            location: 'body',
            path: 'mainContactPhone',
            value: 'not-a-number',
            msg: 'Enter a UK phone number, like 07700 900 982 or 01632 960 001',
          },
        ]
        expectedFlashFormValues = {
          getUpdatesBy: ['email', 'phone'],
          mainContactEmail: 'invalid-email',
          mainContactPhone: 'not-a-number',
        }

        return request(app)
          .post(paths.BOOK_VISIT.CONTACT_DETAILS)
          .send({
            getUpdatesBy: ['email', 'phone'],
            mainContactEmail: 'invalid-email',
            mainContactPhone: 'not-a-number',
          })
          .expect(302)
          .expect('location', paths.BOOK_VISIT.CONTACT_DETAILS)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookingJourney.mainContactEmail).toBeUndefined()
            expect(sessionData.bookingJourney.mainContactPhone).toBeUndefined()

            expect(visitService.changeVisitApplication).not.toHaveBeenCalled()
          })
      })
    })
  })
})
