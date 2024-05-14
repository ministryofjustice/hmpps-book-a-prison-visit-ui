import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import { createMockBookerService, createMockPrisonService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import { FlashData } from '../../@types/bapv'

let app: Express

const bookerService = createMockBookerService()
const prisonService = createMockPrisonService()
let sessionData: SessionData

const url = '/book-a-visit/select-visitors'

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisonerInfoDto()
const prison = TestData.prisonDto()
const visitors = [
  TestData.visitorInfoDto({ personId: 1, firstName: 'Visitor', lastName: 'One', dateOfBirth: '1980-02-03' }),
  TestData.visitorInfoDto({ personId: 2, firstName: 'Visitor', lastName: 'Two', dateOfBirth: '1990-09-03' }),
  TestData.visitorInfoDto({ personId: 3, firstName: 'Visitor', lastName: 'Three', dateOfBirth: '2024-03-01' }),
]

afterEach(() => {
  jest.resetAllMocks()
  jest.useRealTimers()
})

describe('Select visitors page', () => {
  let flashData: FlashData

  describe(`GET ${url}`, () => {
    beforeEach(() => {
      jest.useFakeTimers({ advanceTimers: true, now: new Date('2024-05-01') })

      bookerService.getVisitors.mockResolvedValue(visitors)
      prisonService.getPrison.mockResolvedValue(prison)

      flashData = {}
      flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

      sessionData = {
        booker: { reference: bookerReference, prisoners: [prisoner] },
        bookingJourney: { prisoner },
      } as SessionData

      app = appWithAllRoutes({ services: { bookerService, prisonService }, sessionData })
    })

    it('should render prison visitor rules, visitor list and save all visitors to session', () => {
      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Who is going on the visit\? -/)
          expect($('[data-test="back-link"]').attr('href')).toBe('/')
          expect($('h1').text()).toBe('Who is going on the visit?')

          expect($('[data-test=visitors-max-total]').text().trim().replace(/\s+/g, ' ')).toBe(
            'Up to 6 people can visit someone at Hewell (HMP). This includes:',
          )
          expect($('[data-test=visitors-max-adults]').text().trim().replace(/\s+/g, ' ')).toBe(
            '2 people 16 years old or older',
          )
          expect($('[data-test=visitors-max-child]').text().trim().replace(/\s+/g, ' ')).toBe(
            '4 people under 16 years old',
          )

          expect($('form[method=POST]').attr('action')).toBe('/book-a-visit/select-visitors')
          expect($('input[name=visitorIds]').length).toBe(3)
          expect($('input[name=visitorIds][value=1] + label').text().trim()).toBe('Visitor One, (44 years old)')
          expect($('input[name=visitorIds][value=2] + label').text().trim()).toBe('Visitor Two, (33 years old)')
          expect($('input[name=visitorIds][value=3] + label').text().trim()).toBe('Visitor Three, (2 months old)')

          expect($('[data-test="continue-button"]').text().trim()).toBe('Continue')

          expect(bookerService.getVisitors).toHaveBeenCalledWith(bookerReference, prisoner.prisonerNumber)
          expect(prisonService.getPrison).toHaveBeenCalledWith(prisoner.prisonCode)

          expect(sessionData).toStrictEqual({
            booker: {
              reference: bookerReference,
              prisoners: [prisoner],
            },
            bookingJourney: {
              prisoner,
              prison,
              allVisitors: visitors,
            },
          } as SessionData)
        })
    })

    it('should render validation errors', () => {
      const validationError: FieldValidationError = {
        type: 'field',
        location: 'body',
        path: 'visitorIds',
        value: [],
        msg: 'No visitors selected',
      }

      flashData = { errors: [validationError], formValues: { visitorIds: [] } }

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary a[href="#visitorIds-error"]').text()).toBe('No visitors selected')
          expect($('#visitorIds-error').text()).toContain('No visitors selected')
        })
    })

    it('should handle booker having no visitors for this prisoner', () => {
      bookerService.getVisitors.mockResolvedValue([])

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Who is going on the visit\? -/)
          expect($('[data-test="back-link"]').attr('href')).toBe('/')
          expect($('h1').text()).toBe('Who is going on the visit?')

          expect($('[data-test=visitors-max-total]').length).toBe(0)
          expect($('[data-test=visitors-max-adults]').length).toBe(0)
          expect($('[data-test=visitors-max-child]').length).toBe(0)

          expect($('form[method=POST]').length).toBe(0)
          expect($('input[name=visitorIds]').length).toBe(0)

          expect($('[data-test="continue-button"]').length).toBe(0)

          expect(bookerService.getVisitors).toHaveBeenCalledWith(bookerReference, prisoner.prisonerNumber)
          expect(prisonService.getPrison).toHaveBeenCalledWith(prisoner.prisonCode)

          expect(sessionData).toStrictEqual({
            booker: {
              reference: bookerReference,
              prisoners: [prisoner],
            },
            bookingJourney: {
              prisoner,
              prison,
              allVisitors: [],
            },
          } as SessionData)
        })
    })
  })

  describe(`POST ${url}`, () => {
    beforeEach(() => {
      sessionData = {
        booker: { reference: bookerReference, prisoners: [prisoner] },
        bookingJourney: { prisoner, prison, allVisitors: visitors },
      } as SessionData

      app = appWithAllRoutes({ sessionData })
    })

    it('should should save selected visitors to session and redirect to select date and time page', () => {
      return request(app)
        .post(url)
        .send({ visitorIds: [1, 3] })
        .expect(302)
        .expect('Location', '/book-a-visit/select-date-and-time')
        .expect(() => {
          expect(sessionData).toStrictEqual({
            booker: {
              reference: bookerReference,
              prisoners: [prisoner],
            },
            bookingJourney: {
              prisoner,
              prison,
              allVisitors: visitors,
              selectedVisitors: [visitors[0], visitors[2]],
            },
          } as SessionData)
        })
    })

    it('should filter out invalid visitor IDs', () => {
      return request(app)
        .post(url)
        .send({ visitorIds: [1, 999, 3] })
        .expect(302)
        .expect('Location', '/book-a-visit/select-date-and-time')
        .expect(() => {
          expect(sessionData).toStrictEqual({
            booker: {
              reference: bookerReference,
              prisoners: [prisoner],
            },
            bookingJourney: {
              prisoner,
              prison,
              allVisitors: visitors,
              selectedVisitors: [visitors[0], visitors[2]], // invalid ID '999' filtered out
            },
          } as SessionData)
        })
    })

    it('should set a validation error and redirect to original page when no visitors selected', () => {
      const expectedFlashData: FlashData = {
        errors: [
          {
            type: 'field',
            location: 'body',
            path: 'visitorIds',
            value: [],
            msg: 'No visitors selected',
          },
        ],
        formValues: { visitorIds: [] },
      }

      return request(app)
        .post(url)
        .expect(302)
        .expect('Location', url)
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashData.errors)
          expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashData.formValues)

          expect(sessionData).toStrictEqual({
            booker: {
              reference: bookerReference,
              prisoners: [prisoner],
            },
            bookingJourney: {
              prisoner,
              prison,
              allVisitors: visitors,
            },
          } as SessionData)
        })
    })
  })
})
