import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import { FlashData } from '../../@types/bapv'

let app: Express

let sessionData: SessionData

const url = '/book-visit/main-contact'

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner()
const prison = TestData.prisonDto()
const visitor = TestData.visitor()

afterEach(() => {
  jest.resetAllMocks()
})

describe('Main contact', () => {
  let flashData: FlashData

  describe(`GET ${url}`, () => {
    beforeEach(() => {
      flashData = {}
      flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

      sessionData = {
        booker: { reference: bookerReference, prisoners: [prisoner] },
        bookingJourney: {
          prisoner,
          prison,
          allVisitors: [visitor],
          selectedVisitors: [visitor],
          allVisitSessionIds: ['2024-05-30_a'],
          selectedSessionDate: '2024-05-30',
          selectedSessionTemplateReference: 'a',
          applicationReference: TestData.applicationDto().reference,
        },
      } as SessionData

      app = appWithAllRoutes({ sessionData })
    })

    it('should render main contact page with all fields empty', () => {
      return request(app)
        .get(url)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Who is the main contact for this booking?')
          expect($('input[name="contact"]').length).toBe(2)
          expect($('input[name="contact"]:checked').length).toBe(0)
          expect($('input[name="contact"]').eq(0).prop('value')).toBe('1')
          expect($('input[name="contact"]').eq(1).prop('value')).toBe('someoneElse')
          expect($('#someoneElseName').prop('value')).toBeFalsy()
          expect($('#phoneNumber').prop('value')).toBeFalsy()
        })
    })

    it('should render validation errors from flash data for when no data entered', () => {
      flashData.errors = [
        { location: 'body', msg: 'No main contact selected', path: 'contact', type: 'field', value: undefined },
        { location: 'body', msg: 'Enter a phone number', path: 'phoneNumber', type: 'field', value: undefined },
      ]

      return request(app)
        .get(url)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Who is the main contact for this booking?')
          expect($('.govuk-error-summary__body').text()).toContain('No main contact selected')
          expect($('.govuk-error-summary__body a').eq(0).attr('href')).toBe('#contact-error')
          expect($('.govuk-error-summary__body').text()).toContain('Enter a phone number')
          expect($('.govuk-error-summary__body a').eq(1).attr('href')).toBe('#phoneNumber-error')
          expect($('#contact-error').text()).toContain('No main contact selected')
          expect($('#phoneNumber-error').text()).toContain('Enter a phone number')
          expect(flashProvider).toHaveBeenCalledWith('errors')
          expect(flashProvider).toHaveBeenCalledWith('formValues')
          expect(flashProvider).toHaveBeenCalledTimes(2)
        })
    })
  })

  describe(`POST ${url}`, () => {
    beforeEach(() => {
      flashData = {}
      flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

      sessionData = {
        booker: { reference: bookerReference, prisoners: [prisoner] },
        bookingJourney: {
          prisoner,
          prison,
          allVisitors: [visitor],
          selectedVisitors: [visitor],
          allVisitSessionIds: ['2024-05-30_a'],
          selectedSessionDate: '2024-05-30',
          selectedSessionTemplateReference: 'a',
          applicationReference: TestData.applicationDto().reference,
        },
      } as SessionData

      app = appWithAllRoutes({ sessionData })
    })

    it('should redirect to request method page and store in session if contact selected and phone number entered', () => {
      return request(app)
        .post(url)
        .send('contact=1')
        .send('hasPhoneNumber=yes')
        .send('phoneNumber=+0114+1234+567+')
        .expect(302)
        .expect('location', `/book-visit/check-visit-details`)
        .expect(() => {
          expect(sessionData.bookingJourney.mainContact).toStrictEqual({
            contact: {
              adult: true,
              dateOfBirth: '1980-02-21',
              firstName: 'Joan',
              lastName: 'Phillips',
              visitorDisplayId: 1,
              visitorId: 1234,
            },
            contactName: undefined,
            phoneNumber: '0114 1234 567',
          })
          expect(sessionData.bookingJourney.mainContact.phoneNumber).toBe('0114 1234 567')
          expect(sessionData.bookingJourney.mainContact.contactName).toBe(undefined)
        })
    })

    it('should redirect to request method page and store in session if contact selected and phone number entered', () => {
      return request(app)
        .post(url)
        .send('contact=1')
        .send('hasPhoneNumber=yes')
        .send('phoneNumber=+0114+1234+567+')
        .expect(302)
        .expect('location', `/book-visit/check-visit-details`)
        .expect(() => {
          expect(sessionData.bookingJourney.mainContact).toStrictEqual({
            contact: {
              adult: true,
              dateOfBirth: '1980-02-21',
              firstName: 'Joan',
              lastName: 'Phillips',
              visitorDisplayId: 1,
              visitorId: 1234,
            },
            contactName: undefined,
            phoneNumber: '0114 1234 567',
          })
          expect(sessionData.bookingJourney.mainContact.phoneNumber).toBe('0114 1234 567')
          expect(sessionData.bookingJourney.mainContact.contactName).toBe(undefined)
        })
    })

    it('should redirect to request method page and store in session if other contact selected and phone number entered', () => {
      return request(app)
        .post(url)
        .send('contact=someoneElse')
        .send('someoneElseName=Keith+Richards')
        .send('hasPhoneNumber=yes')
        .send('phoneNumber=+0223+5827+011+')
        .expect(302)
        .expect('location', `/book-visit/check-visit-details`)
        .expect(() => {
          expect(sessionData.bookingJourney.mainContact).toEqual({
            contact: undefined,
            contactName: 'Keith Richards',
            phoneNumber: '0223 5827 011',
          })
          expect(sessionData.bookingJourney.mainContact.phoneNumber).toBe('0223 5827 011')
          expect(sessionData.bookingJourney.mainContact.contactName).toBe('Keith Richards')
        })
    })
  })
})
