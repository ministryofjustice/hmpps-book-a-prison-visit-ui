import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { FlashData, appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import logger from '../../../logger'
import { SessionRestriction } from '../../data/orchestrationApiClient'
import { FlashFormValues } from '../../@types/bapv'

jest.mock('../../../logger')

let app: Express

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
    },
  } as SessionData

  app = appWithAllRoutes({ sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Main contact', () => {
  describe(`GET ${paths.BOOK_VISIT.MAIN_CONTACT}`, () => {
    let flashData: FlashData

    beforeEach(() => {
      flashData = {}
      flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])
    })

    it('should use the session validation middleware', () => {
      sessionData.bookingJourney.prisoner = undefined

      return request(app)
        .get(paths.BOOK_VISIT.MAIN_CONTACT)
        .expect(302)
        .expect('Location', paths.HOME)
        .expect(res => {
          expect(logger.info).toHaveBeenCalledWith(expect.stringMatching('Session validation failed'))
        })
    })

    it('should render main contact page with selected adult visitors and all fields empty', () => {
      return request(app)
        .get(paths.BOOK_VISIT.MAIN_CONTACT)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Who is the main contact for this booking\? -/)
          expect($('#navigation').length).toBe(0)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
          expect($('h1').text().trim()).toBe('Who is the main contact for this booking?')

          expect($('form[method=POST]').attr('action')).toBe(paths.BOOK_VISIT.MAIN_CONTACT)
          expect($('input[name="contact"]').length).toBe(2) // Only adult visitor and 'Someone else'
          expect($('input[name="contact"]:checked').length).toBe(0)
          expect($('input[name="contact"][value=uuidv4-1] + label').text().trim()).toBe('Joan Phillips')
          expect($('input[name="contact"][value=someoneElse] + label').text().trim()).toBe('Someone else')
          expect($('#someoneElseName').prop('value')).toBeFalsy()
        })
    })

    it('should pre-populate with data in session (main contact)', () => {
      sessionData.bookingJourney.mainContact = adultVisitor1

      return request(app)
        .get(paths.BOOK_VISIT.MAIN_CONTACT)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input[name="contact"][value=uuidv4-1]:checked').length).toBe(1)
          expect($('input[name="contact"][value=uuidv4-1] + label').text().trim()).toBe('Joan Phillips')
        })
    })

    it('should pre-populate with data in session (other contact)', () => {
      sessionData.bookingJourney.mainContact = 'Different Person'

      return request(app)
        .get(paths.BOOK_VISIT.MAIN_CONTACT)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input[name="contact"][value=someoneElse]:checked').length).toBe(1)
          expect($('#someoneElseName').prop('value')).toBe('Different Person')
        })
    })

    it('should pre-populate with data in formValues overriding that in session', () => {
      sessionData.bookingJourney.mainContact = adultVisitor1
      const formValues = { contact: 'someoneElse', someoneElseName: 'Different Person' }
      flashData = { formValues: [formValues] }

      return request(app)
        .get(paths.BOOK_VISIT.MAIN_CONTACT)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input[name="contact"][value=someoneElse]:checked').length).toBe(1)
          expect($('#someoneElseName').prop('value')).toBe('Different Person')
        })
    })

    it('should render validation errors', () => {
      const validationErrors: FieldValidationError[] = [
        { location: 'body', msg: 'No main contact selected', path: 'contact', type: 'field', value: undefined },
      ]
      flashData = { errors: validationErrors }

      return request(app)
        .get(paths.BOOK_VISIT.MAIN_CONTACT)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Error: Who is the main contact for this booking\? -/)
          expect($('.govuk-error-summary a[href=#contact]').text()).toBe('No main contact selected')
          expect($('#contact-error').text()).toContain('No main contact selected')
        })
    })
  })

  describe(`POST ${paths.BOOK_VISIT.MAIN_CONTACT}`, () => {
    it('should save selected contact to session and redirect to contact details page', () => {
      return request(app)
        .post(paths.BOOK_VISIT.MAIN_CONTACT)
        .send({ contact: adultVisitor1.visitorDisplayId.toString() })
        .expect(302)
        .expect('location', paths.BOOK_VISIT.CONTACT_DETAILS)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.bookingJourney.mainContact).toStrictEqual(adultVisitor1)
        })
    })

    it('should save custom contact name to session and redirect to contact details page', () => {
      return request(app)
        .post(paths.BOOK_VISIT.MAIN_CONTACT)
        .send({ contact: 'someoneElse', someoneElseName: 'Someone Else' })
        .expect(302)
        .expect('location', paths.BOOK_VISIT.CONTACT_DETAILS)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.bookingJourney.mainContact).toStrictEqual('Someone Else')
        })
    })

    describe('Validation errors', () => {
      let expectedFlashErrors: FieldValidationError[]
      let expectedFlashFormValues: FlashFormValues

      it('should discard any unexpected form data', () => {
        expectedFlashErrors = [
          { type: 'field', location: 'body', path: 'contact', value: undefined, msg: 'No main contact selected' },
        ]
        expectedFlashFormValues = {}

        return request(app)
          .post(paths.BOOK_VISIT.MAIN_CONTACT)
          .send({ unexpected: 'data' })
          .expect(302)
          .expect('location', paths.BOOK_VISIT.MAIN_CONTACT)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookingJourney.mainContact).toBe(undefined)
          })
      })

      it('should set a validation error when no contact selected and redirect to original page', () => {
        expectedFlashErrors = [
          { type: 'field', location: 'body', path: 'contact', value: undefined, msg: 'No main contact selected' },
        ]
        expectedFlashFormValues = {}

        return request(app)
          .post(paths.BOOK_VISIT.MAIN_CONTACT)
          .expect(302)
          .expect('location', paths.BOOK_VISIT.MAIN_CONTACT)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookingJourney.mainContact).toBe(undefined)
          })
      })

      it('should set a validation error when other contact selected but no name and redirect to original page', () => {
        expectedFlashErrors = [
          {
            type: 'field',
            location: 'body',
            path: 'someoneElseName',
            value: '',
            msg: 'Enter the name of the main contact',
          },
        ]
        expectedFlashFormValues = {
          contact: 'someoneElse',
          someoneElseName: '',
        }

        return request(app)
          .post(paths.BOOK_VISIT.MAIN_CONTACT)
          .send({ contact: 'someoneElse' })
          .expect(302)
          .expect('location', paths.BOOK_VISIT.MAIN_CONTACT)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookingJourney.mainContact).toBe(undefined)
          })
      })

      it('should filter out an invalid contact selection (child visitor)', () => {
        expectedFlashErrors = [
          { type: 'field', location: 'body', path: 'contact', value: undefined, msg: 'No main contact selected' },
        ]
        expectedFlashFormValues = {
          contact: undefined,
          someoneElseName: undefined,
        }

        return request(app)
          .post(paths.BOOK_VISIT.MAIN_CONTACT)
          .send({ contact: childVisitor.visitorDisplayId.toString() })
          .expect(302)
          .expect('location', paths.BOOK_VISIT.MAIN_CONTACT)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookingJourney.mainContact).toBe(undefined)
          })
      })

      it('should filter out an invalid contact selection (unrecognised visitor ID)', () => {
        expectedFlashErrors = [
          { type: 'field', location: 'body', path: 'contact', value: undefined, msg: 'No main contact selected' },
        ]
        expectedFlashFormValues = {
          contact: undefined,
          someoneElseName: undefined,
        }

        return request(app)
          .post(paths.BOOK_VISIT.MAIN_CONTACT)
          .send({ contact: '999' })
          .expect(302)
          .expect('location', paths.BOOK_VISIT.MAIN_CONTACT)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookingJourney.mainContact).toBe(undefined)
          })
      })
    })
  })
})
