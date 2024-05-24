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

const fakeDate = new Date('2024-05-02')
const visitors = [
  TestData.visitor({
    displayId: 1,
    visitorId: 1000,
    firstName: 'Visitor',
    lastName: 'Age 20y',
    dateOfBirth: '2004-04-01',
  }),
  TestData.visitor({
    displayId: 2,
    visitorId: 2000,
    firstName: 'Visitor',
    lastName: 'Age 18y',
    dateOfBirth: '2006-05-02', // 18 today
  }),
  TestData.visitor({
    displayId: 3,
    visitorId: 3000,
    firstName: 'Visitor',
    lastName: 'Age 17y',
    dateOfBirth: '2006-05-03', // 18 tomorrow
  }),
  TestData.visitor({
    displayId: 4,
    visitorId: 4000,
    firstName: 'Visitor',
    lastName: 'Age 16y',
    dateOfBirth: '2008-05-02', // 16 today
  }),
  TestData.visitor({
    displayId: 5,
    visitorId: 5000,
    firstName: 'Visitor',
    lastName: 'Age 15y',
    dateOfBirth: '2008-05-03', // 16 tomorrow
  }),
  TestData.visitor({
    displayId: 6,
    visitorId: 6000,
    firstName: 'Visitor',
    lastName: 'Age 10y',
    dateOfBirth: '2014-05-02',
  }),
  TestData.visitor({
    displayId: 7,
    visitorId: 7000,
    firstName: 'Visitor',
    lastName: 'Age 1y',
    dateOfBirth: '2023-05-02',
  }),
  TestData.visitor({
    displayId: 8,
    visitorId: 8000,
    firstName: 'Visitor',
    lastName: 'Age 4m',
    dateOfBirth: '2024-01-02',
  }),
]

beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true, now: fakeDate })
})

afterEach(() => {
  jest.resetAllMocks()
  jest.useRealTimers()
})

describe('Select visitors page', () => {
  let flashData: FlashData

  describe(`GET ${url}`, () => {
    beforeEach(() => {
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

          expect($('[data-test=visitors-max-total]').text()).toBe('4 people')
          expect($('[data-test=prison-name]').text()).toBe('Hewell (HMP)')
          expect($('[data-test=visitors-max-adults]').text()).toBe('2 people')
          expect($('[data-test=visitors-max-children]').text()).toBe('3 people')
          expect($('[data-test=visitors-adult-age]').eq(0).text()).toBe('16 years')
          expect($('[data-test=visitors-adult-age]').eq(1).text()).toBe('16 years')

          expect($('form[method=POST]').attr('action')).toBe('/book-a-visit/select-visitors')
          expect($('input[name=visitorIds]').length).toBe(8)
          expect($('input[name=visitorIds][value=1] + label').text().trim()).toBe('Visitor Age 20y (20 years old)')
          expect($('input[name=visitorIds][value=2] + label').text().trim()).toBe('Visitor Age 18y (18 years old)')
          expect($('input[name=visitorIds][value=3] + label').text().trim()).toBe('Visitor Age 17y (17 years old)')
          expect($('input[name=visitorIds][value=4] + label').text().trim()).toBe('Visitor Age 16y (16 years old)')
          expect($('input[name=visitorIds][value=5] + label').text().trim()).toBe('Visitor Age 15y (15 years old)')
          expect($('input[name=visitorIds][value=6] + label').text().trim()).toBe('Visitor Age 10y (10 years old)')
          expect($('input[name=visitorIds][value=7] + label').text().trim()).toBe('Visitor Age 1y (1 year old)')
          expect($('input[name=visitorIds][value=8] + label').text().trim()).toBe('Visitor Age 4m (4 months old)')

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
          expect($('title').text()).toMatch(/^Error: Who is going on the visit\? -/)
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
          expect($('[data-test=visitors-max-children]').length).toBe(0)

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

    it('should filter out invalid or duplicate visitor IDs', () => {
      return request(app)
        .post(url)
        .send({ visitorIds: [1, 1, 999, 3] })
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
              selectedVisitors: [visitors[0], visitors[2]], // duplicate '1' & invalid ID '999' filtered out
            },
          } as SessionData)
        })
    })

    describe('Validation errors', () => {
      // Uses visitor age config in TestData.prisonDto()
      let expectedFlashData: FlashData

      beforeEach(() => {
        expectedFlashData = {
          errors: [{ type: 'field', location: 'body', path: 'visitorIds', value: [], msg: '' }],
          formValues: { visitorIds: [] },
        }
      })

      it('should set a validation error and redirect to original page when no visitors selected', () => {
        expectedFlashData.errors[0].msg = 'No visitors selected'
        expectedFlashData.formValues.visitorIds = []

        return request(app)
          .post(url)
          .expect(302)
          .expect('Location', url)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashData.errors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashData.formValues)
            expect(sessionData.bookingJourney.selectedVisitors).toBe(undefined)
          })
      })

      it('should set a validation error and redirect to original page when max total visitors exceeded', () => {
        const visitorIds = [1, 2, 5, 6, 7]
        expectedFlashData.errors[0].msg = 'Select no more than 4 visitors'
        expectedFlashData.errors[0].value = visitorIds
        expectedFlashData.formValues.visitorIds = visitorIds

        return request(app)
          .post(url)
          .send({ visitorIds })
          .expect(302)
          .expect('Location', url)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashData.errors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashData.formValues)
            expect(sessionData.bookingJourney.selectedVisitors).toBe(undefined)
          })
      })

      it('should set a validation error and redirect to original page when max total adult age visitors exceeded', () => {
        const visitorIds = [1, 2, 3]
        expectedFlashData.errors[0].msg = 'Select no more than 2 visitors 16 years old or older'
        expectedFlashData.errors[0].value = visitorIds
        expectedFlashData.formValues.visitorIds = visitorIds

        return request(app)
          .post(url)
          .send({ visitorIds })
          .expect(302)
          .expect('Location', url)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashData.errors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashData.formValues)
            expect(sessionData.bookingJourney.selectedVisitors).toBe(undefined)
          })
      })

      it('should set a validation error and redirect to original page when max total child age visitors exceeded', () => {
        const visitorIds = [5, 6, 7, 8]
        expectedFlashData.errors[0].msg = 'Select no more than 3 visitors under 16 years old'
        expectedFlashData.errors[0].value = visitorIds
        expectedFlashData.formValues.visitorIds = visitorIds

        return request(app)
          .post(url)
          .send({ visitorIds })
          .expect(302)
          .expect('Location', url)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashData.errors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashData.formValues)
            expect(sessionData.bookingJourney.selectedVisitors).toBe(undefined)
          })
      })

      it('should set a validation error and redirect to original page no visitor over 18 is selected', () => {
        const visitorIds = [3]
        expectedFlashData.errors[0].msg = 'Add a visitor who is 18 years old or older'
        expectedFlashData.errors[0].value = visitorIds
        expectedFlashData.formValues.visitorIds = visitorIds

        return request(app)
          .post(url)
          .send({ visitorIds })
          .expect(302)
          .expect('Location', url)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashData.errors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashData.formValues)
            expect(sessionData.bookingJourney.selectedVisitors).toBe(undefined)
          })
      })
    })
  })
})
