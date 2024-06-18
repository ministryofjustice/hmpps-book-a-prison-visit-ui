import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { FlashData, FlashErrors, FlashFormValues, appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import { createMockVisitService } from '../../services/testutils/mocks'

let app: Express

const visitService = createMockVisitService()
let sessionData: SessionData

const url = '/book-visit/main-contact'

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner()
const prison = TestData.prisonDto()
const adultVisitor = TestData.visitor()
const childVisitor = TestData.visitor({ dateOfBirth: `${new Date().getFullYear() - 2}-01-01`, adult: false })
const visitSession = TestData.availableVisitSessionDto()

beforeEach(() => {
  sessionData = {
    booker: { reference: bookerReference, prisoners: [prisoner] },
    bookingJourney: {
      prisoner,
      prison,
      allVisitors: [adultVisitor, childVisitor],
      selectedVisitors: [adultVisitor, childVisitor],
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
  describe(`GET ${url}`, () => {
    let flashData: FlashData

    beforeEach(() => {
      flashData = {}
      flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])
    })

    it('should render main contact page with all fields empty', () => {
      return request(app)
        .get(url)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Who is the main contact for this booking\? -/)
          expect($('[data-test="back-link"]').attr('href')).toBe('/book-visit/additional-support')
          expect($('h1').text()).toBe('Who is the main contact for this booking?')

          expect($('form[method=POST]').attr('action')).toBe('/book-visit/main-contact')
          expect($('input[name="contact"]').length).toBe(2)
          expect($('input[name="contact"]:checked').length).toBe(0)
          expect($('input[name="contact"][value=1] + label').text().trim()).toBe('Joan Phillips')
          expect($('input[name="contact"][value=someoneElse] + label').text().trim()).toBe('Someone else')
          expect($('#someoneElseName').prop('value')).toBeFalsy()

          expect($('input[name=hasPhoneNumber]:checked').length).toBe(0)
          expect($('#phoneNumber').prop('value')).toBeFalsy()
        })
    })

    it('should pre-populate with data in session (contact and phone number)', () => {
      sessionData.bookingJourney.mainContact = { contact: adultVisitor, phoneNumber: '01234 567 890' }

      return request(app)
        .get(url)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input[name="contact"][value=1]:checked').length).toBe(1)
          expect($('input[name="contact"][value=1] + label').text().trim()).toBe('Joan Phillips')

          expect($('input[name=hasPhoneNumber][value=yes]:checked').length).toBe(1)
          expect($('#phoneNumber').prop('value')).toBe('01234 567 890')
        })
    })

    it('should pre-populate with data in session (other contact and no phone number)', () => {
      sessionData.bookingJourney.mainContact = { contact: 'Different Person' }

      return request(app)
        .get(url)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input[name="contact"][value=someoneElse]:checked').length).toBe(1)
          expect($('#someoneElseName').prop('value')).toBe('Different Person')

          expect($('input[name=hasPhoneNumber][value=no]:checked').length).toBe(1)
          expect($('#phoneNumber').prop('value')).toBeFalsy()
        })
    })

    it('should pre-populate with data in formValues overriding that in session', () => {
      sessionData.bookingJourney.mainContact = { contact: adultVisitor, phoneNumber: '01234 567 890' }
      const formValues = { contact: 'someoneElse', someoneElseName: 'Different Person', hasPhoneNumber: 'no' }
      flashData = { formValues: [formValues] }

      return request(app)
        .get(url)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input[name="contact"][value=someoneElse]:checked').length).toBe(1)
          expect($('#someoneElseName').prop('value')).toBe('Different Person')

          expect($('input[name=hasPhoneNumber][value=no]:checked').length).toBe(1)
          expect($('#phoneNumber').prop('value')).toBeFalsy()
        })
    })

    it('should render validation errors', () => {
      const validationErrors: FieldValidationError[] = [
        { location: 'body', msg: 'No main contact selected', path: 'contact', type: 'field', value: undefined },
        { location: 'body', msg: 'Enter a phone number', path: 'phoneNumber', type: 'field', value: undefined },
      ]
      flashData = { errors: validationErrors }

      return request(app)
        .get(url)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Error: Who is the main contact for this booking\? -/)
          expect($('.govuk-error-summary a[href=#contact-error]').text()).toBe('No main contact selected')
          expect($('#contact-error').text()).toContain('No main contact selected')
          expect($('.govuk-error-summary a[href=#phoneNumber-error]').text()).toBe('Enter a phone number')
          expect($('#phoneNumber-error').text()).toContain('Enter a phone number')
        })
    })
  })

  describe(`POST ${url}`, () => {
    const application = TestData.applicationDto()

    beforeEach(() => {
      visitService.changeVisitApplication.mockResolvedValue(application)

      app = appWithAllRoutes({ services: { visitService }, sessionData })
    })

    it('should save selected contact and phone number to session, update application and redirect to check visit details page', () => {
      return request(app)
        .post(url)
        .send({ contact: '1', hasPhoneNumber: 'yes', phoneNumber: '01234 567 890' })
        .expect(302)
        .expect('location', `/book-visit/check-visit-details`)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.bookingJourney.mainContact).toStrictEqual({
            contact: adultVisitor,
            phoneNumber: '01234 567 890',
          })

          expect(visitService.changeVisitApplication).toHaveBeenCalledWith({
            bookingJourney: sessionData.bookingJourney,
          })
        })
    })

    it('should save selected contact and no phone number to session, update application and redirect to check visit details page', () => {
      return request(app)
        .post(url)
        .send({ contact: '1', hasPhoneNumber: 'no' })
        .expect(302)
        .expect('location', `/book-visit/check-visit-details`)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.bookingJourney.mainContact).toStrictEqual({ contact: adultVisitor })

          expect(visitService.changeVisitApplication).toHaveBeenCalledWith({
            bookingJourney: sessionData.bookingJourney,
          })
        })
    })

    it('should save custom contact name and no phone number to session, update application and redirect to check visit details page', () => {
      return request(app)
        .post(url)
        .send({
          contact: 'someoneElse',
          someoneElseName: 'Someone Else',
          hasPhoneNumber: 'no',
        })
        .expect(302)
        .expect('location', `/book-visit/check-visit-details`)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.bookingJourney.mainContact).toStrictEqual({ contact: 'Someone Else' })

          expect(visitService.changeVisitApplication).toHaveBeenCalledWith({
            bookingJourney: sessionData.bookingJourney,
          })
        })
    })

    describe('Validation errors', () => {
      let expectedFlashErrors: FlashErrors
      let expectedFlashFormValues: FlashFormValues

      it('should discard any unexpected form data', () => {
        expectedFlashErrors = [
          { type: 'field', location: 'body', path: 'contact', value: undefined, msg: 'No main contact selected' },
          { type: 'field', location: 'body', path: 'hasPhoneNumber', value: undefined, msg: 'No answer selected' },
        ]
        expectedFlashFormValues = { someoneElseName: '', phoneNumber: '' }

        return request(app)
          .post(url)
          .send({ unexpected: 'data' })
          .expect(302)
          .expect('location', url)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookingJourney.mainContact).toBe(undefined)

            expect(visitService.changeVisitApplication).not.toHaveBeenCalled()
          })
      })

      it('should set a validation error when no contact or phone choice selected and redirect to original page', () => {
        expectedFlashErrors = [
          { type: 'field', location: 'body', path: 'contact', value: undefined, msg: 'No main contact selected' },
          { type: 'field', location: 'body', path: 'hasPhoneNumber', value: undefined, msg: 'No answer selected' },
        ]
        expectedFlashFormValues = { someoneElseName: '', phoneNumber: '' }

        return request(app)
          .post(url)
          .expect(302)
          .expect('location', url)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookingJourney.mainContact).toBe(undefined)

            expect(visitService.changeVisitApplication).not.toHaveBeenCalled()
          })
      })

      it('should set a validation error when other contact and phone choice selected but no answers and redirect to original page', () => {
        expectedFlashErrors = [
          {
            type: 'field',
            location: 'body',
            path: 'someoneElseName',
            value: '',
            msg: 'Enter the name of the main contact',
          },
          { type: 'field', location: 'body', path: 'phoneNumber', value: '', msg: 'Enter a phone number' },
        ]
        expectedFlashFormValues = {
          contact: 'someoneElse',
          someoneElseName: '',
          hasPhoneNumber: 'yes',
          phoneNumber: '',
        }

        return request(app)
          .post(url)
          .send({ contact: 'someoneElse', hasPhoneNumber: 'yes' })
          .expect(302)
          .expect('location', url)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookingJourney.mainContact).toBe(undefined)

            expect(visitService.changeVisitApplication).not.toHaveBeenCalled()
          })
      })

      it('should set a validation error phone number invalid and redirect to original page', () => {
        expectedFlashErrors = [
          {
            type: 'field',
            location: 'body',
            path: 'phoneNumber',
            value: 'abcd1234',
            msg: 'Enter a UK phone number, like 07700 900 982 or 01632 960 001',
          },
        ]
        expectedFlashFormValues = { contact: '1', someoneElseName: '', hasPhoneNumber: 'yes', phoneNumber: 'abcd1234' }

        return request(app)
          .post(url)
          .send({ contact: '1', hasPhoneNumber: 'yes', phoneNumber: 'abcd1234' })
          .expect(302)
          .expect('location', url)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookingJourney.mainContact).toBe(undefined)

            expect(visitService.changeVisitApplication).not.toHaveBeenCalled()
          })
      })
    })
  })
})
