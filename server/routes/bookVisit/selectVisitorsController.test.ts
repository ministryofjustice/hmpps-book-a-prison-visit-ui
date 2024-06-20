import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { FlashData, FlashErrors, FlashFormValues, appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import { createMockBookerService, createMockPrisonService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import logger from '../../../logger'

jest.mock('../../../logger')

let app: Express

const bookerService = createMockBookerService()
const prisonService = createMockPrisonService()
let sessionData: SessionData

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner()
const prison = TestData.prisonDto()

const fakeDate = new Date('2024-05-02')

const visitor1 = TestData.visitor({
  visitorDisplayId: 1,
  visitorId: 1000,
  firstName: 'Visitor',
  lastName: 'Age 20y',
  dateOfBirth: '2004-04-01',
})
const visitor2 = TestData.visitor({
  visitorDisplayId: 2,
  visitorId: 2000,
  firstName: 'Visitor',
  lastName: 'Age 18y',
  dateOfBirth: '2006-05-02', // 18 today
})
const visitor3 = TestData.visitor({
  visitorDisplayId: 3,
  visitorId: 3000,
  firstName: 'Visitor',
  lastName: 'Age 17y',
  dateOfBirth: '2006-05-03', // 18 tomorrow
})
const visitor4 = TestData.visitor({
  visitorDisplayId: 4,
  visitorId: 4000,
  firstName: 'Visitor',
  lastName: 'Age 16y',
  dateOfBirth: '2008-05-02', // 16 today
})
const visitor5 = TestData.visitor({
  visitorDisplayId: 5,
  visitorId: 5000,
  firstName: 'Visitor',
  lastName: 'Age 15y',
  dateOfBirth: '2008-05-03', // 16 tomorrow
})
const visitor6 = TestData.visitor({
  visitorDisplayId: 6,
  visitorId: 6000,
  firstName: 'Visitor',
  lastName: 'Age 10y',
  dateOfBirth: '2014-05-02',
})
const visitor7 = TestData.visitor({
  visitorDisplayId: 7,
  visitorId: 7000,
  firstName: 'Visitor',
  lastName: 'Age 1y',
  dateOfBirth: '2023-05-02',
})
const visitor8 = TestData.visitor({
  visitorDisplayId: 8,
  visitorId: 8000,
  firstName: 'Visitor',
  lastName: 'Age 4m',
  dateOfBirth: '2024-01-02',
})
const visitors = [visitor1, visitor2, visitor3, visitor4, visitor5, visitor6, visitor7, visitor8]

beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true, now: fakeDate })
})

afterEach(() => {
  jest.resetAllMocks()
  jest.useRealTimers()
})

describe('Select visitors', () => {
  describe(`GET ${paths.BOOK_VISIT.SELECT_VISITORS}`, () => {
    let flashData: FlashData

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

    it('should use the session validation middleware', () => {
      sessionData.bookingJourney.prisoner = undefined

      return request(app)
        .get(paths.BOOK_VISIT.SELECT_VISITORS)
        .expect(302)
        .expect('Location', paths.HOME)
        .expect(res => {
          expect(logger.info).toHaveBeenCalledWith(expect.stringMatching('Session validation failed'))
        })
    })

    it('should render prison visitor rules, visitor list and save all visitors to session', () => {
      return request(app)
        .get(paths.BOOK_VISIT.SELECT_VISITORS)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Who is going on the visit\? -/)
          expect($('#service-header__nav').length).toBe(0)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.HOME)
          expect($('h1').text()).toBe('Who is going on the visit?')

          expect($('[data-test=visitors-max-total]').text()).toBe('4 people')
          expect($('[data-test=prison-name]').text()).toBe('Hewell (HMP)')
          expect($('[data-test=visitors-max-adults]').text()).toBe('2 people')
          expect($('[data-test=visitors-max-children]').text()).toBe('3 people')
          expect($('[data-test=visitors-adult-age]').eq(0).text()).toBe('16 years')
          expect($('[data-test=visitors-adult-age]').eq(1).text()).toBe('16 years')

          expect($('form[method=POST]').attr('action')).toBe(paths.BOOK_VISIT.SELECT_VISITORS)
          expect($('input[name=visitorDisplayIds]').length).toBe(8)
          expect($('input[name=visitorDisplayIds]:checked').length).toBe(0)
          expect($('input[name=visitorDisplayIds][value=1]+label').text().trim()).toBe('Visitor Age 20y (20 years old)')
          expect($('input[name=visitorDisplayIds][value=2]+label').text().trim()).toBe('Visitor Age 18y (18 years old)')
          expect($('input[name=visitorDisplayIds][value=3]+label').text().trim()).toBe('Visitor Age 17y (17 years old)')
          expect($('input[name=visitorDisplayIds][value=4]+label').text().trim()).toBe('Visitor Age 16y (16 years old)')
          expect($('input[name=visitorDisplayIds][value=5]+label').text().trim()).toBe('Visitor Age 15y (15 years old)')
          expect($('input[name=visitorDisplayIds][value=6]+label').text().trim()).toBe('Visitor Age 10y (10 years old)')
          expect($('input[name=visitorDisplayIds][value=7]+label').text().trim()).toBe('Visitor Age 1y (1 year old)')
          expect($('input[name=visitorDisplayIds][value=8]+label').text().trim()).toBe('Visitor Age 4m (4 months old)')

          expect($('[data-test="continue-button"]').text().trim()).toBe('Continue')

          expect(bookerService.getVisitors).toHaveBeenCalledWith(bookerReference, prisoner.prisonerNumber)
          expect(prisonService.getPrison).toHaveBeenCalledWith(prisoner.prisonId)

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

    it('should pre-populate with data in session', () => {
      sessionData.bookingJourney.selectedVisitors = [visitor1, visitor4, visitor8]

      return request(app)
        .get(paths.BOOK_VISIT.SELECT_VISITORS)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input[name=visitorDisplayIds]').length).toBe(8)
          expect($('input[name=visitorDisplayIds]:checked').length).toBe(3)
          expect($('input[name=visitorDisplayIds][value=1]:checked + label').length).toBe(1)
          expect($('input[name=visitorDisplayIds][value=4]:checked + label').length).toBe(1)
          expect($('input[name=visitorDisplayIds][value=8]:checked + label').length).toBe(1)
        })
    })

    it('should pre-populate with data in formValues overriding that in session', () => {
      sessionData.bookingJourney.selectedVisitors = [visitor1, visitor4, visitor8]
      const formValues = { visitorDisplayIds: [2, 7] }
      flashData = { formValues: [formValues] }

      return request(app)
        .get(paths.BOOK_VISIT.SELECT_VISITORS)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input[name=visitorDisplayIds]').length).toBe(8)
          expect($('input[name=visitorDisplayIds]:checked').length).toBe(2)
          expect($('input[name=visitorDisplayIds][value=2]:checked + label').length).toBe(1)
          expect($('input[name=visitorDisplayIds][value=7]:checked + label').length).toBe(1)
        })
    })

    it('should render validation errors', () => {
      const validationError: FieldValidationError = {
        type: 'field',
        location: 'body',
        path: 'visitorDisplayIds',
        value: [],
        msg: 'No visitors selected',
      }
      const formValues = { visitorDisplayIds: <number[]>[] }
      flashData = { errors: [validationError], formValues: [formValues] }

      return request(app)
        .get(paths.BOOK_VISIT.SELECT_VISITORS)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Error: Who is going on the visit\? -/)
          expect($('.govuk-error-summary a[href="#visitorDisplayIds-error"]').text()).toBe('No visitors selected')
          expect($('#visitorDisplayIds-error').text()).toContain('No visitors selected')
        })
    })

    it('should handle booker having no visitors for this prisoner', () => {
      bookerService.getVisitors.mockResolvedValue([])

      return request(app)
        .get(paths.BOOK_VISIT.SELECT_VISITORS)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Who is going on the visit\? -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.HOME)
          expect($('h1').text()).toBe('Who is going on the visit?')

          expect($('[data-test=visitors-max-total]').length).toBe(0)
          expect($('[data-test=visitors-max-adults]').length).toBe(0)
          expect($('[data-test=visitors-max-children]').length).toBe(0)

          expect($('form[method=POST]').length).toBe(0)
          expect($('input[name=visitorDisplayIds]').length).toBe(0)

          expect($('[data-test="continue-button"]').length).toBe(0)

          expect(bookerService.getVisitors).toHaveBeenCalledWith(bookerReference, prisoner.prisonerNumber)
          expect(prisonService.getPrison).toHaveBeenCalledWith(prisoner.prisonId)

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

  describe(`POST ${paths.BOOK_VISIT.SELECT_VISITORS}`, () => {
    beforeEach(() => {
      sessionData = {
        booker: { reference: bookerReference, prisoners: [prisoner] },
        bookingJourney: { prisoner, prison, allVisitors: visitors },
      } as SessionData

      app = appWithAllRoutes({ sessionData })
    })

    it('should should save selected visitors to session and redirect to select date and time page', () => {
      return request(app)
        .post(paths.BOOK_VISIT.SELECT_VISITORS)
        .send({ visitorDisplayIds: [1, 3] })
        .expect(302)
        .expect('Location', paths.BOOK_VISIT.CHOOSE_TIME)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData).toStrictEqual({
            booker: {
              reference: bookerReference,
              prisoners: [prisoner],
            },
            bookingJourney: {
              prisoner,
              prison,
              allVisitors: visitors,
              selectedVisitors: [visitor1, visitor3],
            },
          } as SessionData)
        })
    })

    it('should filter out invalid or duplicate visitor IDs', () => {
      return request(app)
        .post(paths.BOOK_VISIT.SELECT_VISITORS)
        .send({ visitorDisplayIds: [1, 1, 999, 3] })
        .expect(302)
        .expect('Location', paths.BOOK_VISIT.CHOOSE_TIME)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
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
      let expectedFlashErrors: FlashErrors
      let expectedFlashFormValues: FlashFormValues

      beforeEach(() => {
        expectedFlashErrors = [{ type: 'field', location: 'body', path: 'visitorDisplayIds', value: [], msg: '' }]
        expectedFlashFormValues = { visitorDisplayIds: [] }
      })

      it('should discard any unexpected form data', () => {
        expectedFlashErrors[0].msg = 'No visitors selected'
        expectedFlashFormValues.visitorDisplayIds = []

        return request(app)
          .post(paths.BOOK_VISIT.SELECT_VISITORS)
          .send({ unexpected: 'data' })
          .expect(302)
          .expect('Location', paths.BOOK_VISIT.SELECT_VISITORS)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookingJourney.selectedVisitors).toBe(undefined)
          })
      })

      it('should set a validation error and redirect to original page when no visitors selected', () => {
        expectedFlashErrors[0].msg = 'No visitors selected'
        expectedFlashFormValues.visitorDisplayIds = []

        return request(app)
          .post(paths.BOOK_VISIT.SELECT_VISITORS)
          .expect(302)
          .expect('Location', paths.BOOK_VISIT.SELECT_VISITORS)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookingJourney.selectedVisitors).toBe(undefined)
          })
      })

      it('should set a validation error and redirect to original page when max total visitors exceeded', () => {
        const visitorDisplayIds = [1, 2, 5, 6, 7]
        expectedFlashErrors[0].msg = 'Select no more than 4 visitors'
        expectedFlashErrors[0].value = visitorDisplayIds
        expectedFlashFormValues.visitorDisplayIds = visitorDisplayIds

        return request(app)
          .post(paths.BOOK_VISIT.SELECT_VISITORS)
          .send({ visitorDisplayIds })
          .expect(302)
          .expect('Location', paths.BOOK_VISIT.SELECT_VISITORS)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookingJourney.selectedVisitors).toBe(undefined)
          })
      })

      it('should set a validation error and redirect to original page when max total adult age visitors exceeded', () => {
        const visitorDisplayIds = [1, 2, 3]
        expectedFlashErrors[0].msg = 'Select no more than 2 visitors 16 years old or older'
        expectedFlashErrors[0].value = visitorDisplayIds
        expectedFlashFormValues.visitorDisplayIds = visitorDisplayIds

        return request(app)
          .post(paths.BOOK_VISIT.SELECT_VISITORS)
          .send({ visitorDisplayIds })
          .expect(302)
          .expect('Location', paths.BOOK_VISIT.SELECT_VISITORS)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookingJourney.selectedVisitors).toBe(undefined)
          })
      })

      it('should set a validation error and redirect to original page when max total child age visitors exceeded', () => {
        const visitorDisplayIds = [5, 6, 7, 8]
        expectedFlashErrors[0].msg = 'Select no more than 3 visitors under 16 years old'
        expectedFlashErrors[0].value = visitorDisplayIds
        expectedFlashFormValues.visitorDisplayIds = visitorDisplayIds

        return request(app)
          .post(paths.BOOK_VISIT.SELECT_VISITORS)
          .send({ visitorDisplayIds })
          .expect(302)
          .expect('Location', paths.BOOK_VISIT.SELECT_VISITORS)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookingJourney.selectedVisitors).toBe(undefined)
          })
      })

      it('should set a validation error and redirect to original page no visitor over 18 is selected', () => {
        const visitorDisplayIds = [3]
        expectedFlashErrors[0].msg = 'Add a visitor who is 18 years old or older'
        expectedFlashErrors[0].value = visitorDisplayIds
        expectedFlashFormValues.visitorDisplayIds = visitorDisplayIds

        return request(app)
          .post(paths.BOOK_VISIT.SELECT_VISITORS)
          .send({ visitorDisplayIds })
          .expect(302)
          .expect('Location', paths.BOOK_VISIT.SELECT_VISITORS)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookingJourney.selectedVisitors).toBe(undefined)
          })
      })
    })
  })
})
