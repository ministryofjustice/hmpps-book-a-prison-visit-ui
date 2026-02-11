import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { randomUUID } from 'crypto'
import { FlashData, appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import { createMockBookerService, createMockVisitSessionsService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import logger from '../../../logger'
import { FlashFormValues } from '../../@types/bapv'
import { VisitorsByEligibility } from '../../services/bookerService'
import { enableFeatureForTest } from '../../data/testutils/mockFeatureFlags'

jest.mock('../../../logger')

let app: Express

const bookerService = createMockBookerService()
const visitSessionsService = createMockVisitSessionsService()
let sessionData: SessionData

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner()
const prison = TestData.prisonDto()

const fakeDate = new Date('2024-05-02')

const visitor1 = TestData.visitor({
  visitorDisplayId: randomUUID(),
  visitorId: 1000,
  firstName: 'Visitor',
  lastName: 'Age 20y',
  dateOfBirth: '2004-04-01',
})
const visitor2 = TestData.visitor({
  visitorDisplayId: randomUUID(),
  visitorId: 2000,
  firstName: 'Visitor',
  lastName: 'Age 18y',
  dateOfBirth: '2006-05-02', // 18 today
})
const visitor3 = TestData.visitor({
  visitorDisplayId: randomUUID(),
  visitorId: 3000,
  firstName: 'Visitor',
  lastName: 'Age 17y',
  dateOfBirth: '2006-05-03', // 18 tomorrow
  adult: false,
})
const visitor4 = TestData.visitor({
  visitorDisplayId: randomUUID(),
  visitorId: 4000,
  firstName: 'Visitor',
  lastName: 'Age 16y',
  dateOfBirth: '2008-05-02', // 16 today
  adult: false,
})
const visitor5 = TestData.visitor({
  visitorDisplayId: randomUUID(),
  visitorId: 5000,
  firstName: 'Visitor',
  lastName: 'Age 15y',
  dateOfBirth: '2008-05-03', // 16 tomorrow
  adult: false,
})
const visitor6 = TestData.visitor({
  visitorDisplayId: randomUUID(),
  visitorId: 6000,
  firstName: 'Visitor',
  lastName: 'Age 10y',
  dateOfBirth: '2014-05-02',
  adult: false,
})
const visitor7 = TestData.visitor({
  visitorDisplayId: randomUUID(),
  visitorId: 7000,
  firstName: 'Visitor',
  lastName: 'Age 1y',
  dateOfBirth: '2023-05-02',
  adult: false,
})
const visitor8 = TestData.visitor({
  visitorDisplayId: randomUUID(),
  visitorId: 8000,
  firstName: 'Visitor',
  lastName: 'Age 4m',
  dateOfBirth: '2024-01-02',
  adult: false,
})
const visitor9 = TestData.visitor({
  visitorDisplayId: randomUUID(),
  visitorId: 9000,
  firstName: 'FirstName',
  lastName: 'LastName',
  dateOfBirth: '2004-04-01',
  adult: false,
  banned: true,
  banExpiryDate: '2024-05-16', // 14 days after currently faked date
})
const visitor10 = TestData.visitor({
  visitorDisplayId: randomUUID(),
  visitorId: 10000,
  firstName: 'FirstName',
  lastName: 'LastName',
  dateOfBirth: '2004-04-01',
  adult: false,
  banned: true,
  banExpiryDate: '2025-05-02', // 1 year after currently faked date
})
const visitor11 = TestData.visitor({
  visitorDisplayId: randomUUID(),
  visitorId: 11000,
  firstName: 'FirstName',
  lastName: 'LastName',
  dateOfBirth: '2004-05-01',
  adult: true,
  approved: false,
})
const visitor12 = TestData.visitor({
  visitorDisplayId: randomUUID(),
  visitorId: 12000,
  firstName: 'FirstName',
  lastName: 'LastName',
  dateOfBirth: '2004-05-01',
  adult: true,
  banned: true,
  approved: false,
})
const eligibleVisitors = [visitor1, visitor2, visitor3, visitor4, visitor5, visitor6, visitor7, visitor8, visitor9]
const ineligibleVisitors = [visitor10, visitor11, visitor12]

let visitors: VisitorsByEligibility
beforeEach(() => {
  visitors = { eligibleVisitors, ineligibleVisitors }
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
      bookerService.getVisitorsByEligibility.mockResolvedValue(visitors)

      flashData = {}
      flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

      sessionData = {
        bookVisitJourney: { prisoner, prison },
      } as SessionData

      app = appWithAllRoutes({ services: { bookerService }, sessionData })
    })

    it('should use the session validation middleware', () => {
      sessionData.bookVisitJourney.prisoner = undefined
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
          expect($('#navigation').length).toBe(0)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.HOME)
          expect($('h1').text()).toBe('Who is going on the visit?')

          expect($('[data-test=visitors-max-total]').text()).toBe('4 people')
          expect($('[data-test=prison-name]').text()).toBe('Hewell (HMP)')
          expect($('[data-test=visitors-max-adults]').text()).toBe('2 people')
          expect($('[data-test=visitors-max-children]').text()).toBe('3 people')
          expect($('[data-test=visitors-adult-age]').eq(0).text()).toBe('16 years')
          expect($('[data-test=visitors-adult-age]').eq(1).text()).toBe('16 years')

          // Select visitors form
          expect($('form[method=POST]').attr('action')).toBe(paths.BOOK_VISIT.SELECT_VISITORS)
          expect($('input[name=visitorDisplayIds]').length).toBe(9)
          expect($('input[name=visitorDisplayIds]:checked').length).toBe(0)
          expect($(`input[name=visitorDisplayIds][value=${visitor1.visitorDisplayId}]+label`).text().trim()).toBe(
            'Visitor Age 20y (20 years old)',
          )
          expect($(`input[name=visitorDisplayIds][value=${visitor2.visitorDisplayId}]+label`).text().trim()).toBe(
            'Visitor Age 18y (18 years old)',
          )
          expect($(`input[name=visitorDisplayIds][value=${visitor3.visitorDisplayId}]+label`).text().trim()).toBe(
            'Visitor Age 17y (17 years old)',
          )
          expect($(`input[name=visitorDisplayIds][value=${visitor4.visitorDisplayId}]+label`).text().trim()).toBe(
            'Visitor Age 16y (16 years old)',
          )
          expect($(`input[name=visitorDisplayIds][value=${visitor5.visitorDisplayId}]+label`).text().trim()).toBe(
            'Visitor Age 15y (15 years old)',
          )
          expect($(`input[name=visitorDisplayIds][value=${visitor6.visitorDisplayId}]+label`).text().trim()).toBe(
            'Visitor Age 10y (10 years old)',
          )
          expect($(`input[name=visitorDisplayIds][value=${visitor7.visitorDisplayId}]+label`).text().trim()).toBe(
            'Visitor Age 1y (1 year old)',
          )
          expect($(`input[name=visitorDisplayIds][value=${visitor8.visitorDisplayId}]+label`).text().trim()).toBe(
            'Visitor Age 4m (4 months old)',
          )
          expect($(`input[name=visitorDisplayIds][value=${visitor8.visitorDisplayId}]+label`).text().trim()).toBe(
            'Visitor Age 4m (4 months old)',
          )

          // Unavailable visitors
          expect($('[data-test="unavailable-visitor-1"]').text().trim()).toContain('FirstName LastName (20 years old)')
          expect($('[data-test="unavailable-visitor-1"]').text().trim()).toContain('Banned')
          expect($('[data-test="ban-expiry-1"]').text().trim()).toContain('FirstName is banned until 2 May 2025.')
          expect($('[data-test="unavailable-visitor-2"]').text().trim()).toContain('FirstName LastName (20 years old)')
          expect($('[data-test="unavailable-visitor-2"]').text().trim()).toContain('Not approved')
          expect($('[data-test="unavailable-visitor-3"]').text().trim()).toContain('FirstName LastName (20 years old)')
          expect($('[data-test="unavailable-visitor-3"]').text().trim()).toContain('Banned')

          // Visitor requests
          expect($('[data-test=visitor-request-1]').length).toBe(0)

          // Link new visitor
          expect($('[data-test=link-a-visitor]').length).toBe(0)
          expect($('[data-test=add-visitor-form]').length).toBe(1)

          expect($('[data-test="continue-button"]').text().trim()).toBe('Continue')

          expect(bookerService.getVisitorsByEligibility).toHaveBeenCalledWith({
            bookerReference,
            prisonerNumber: prisoner.prisonerNumber,
            policyNoticeDaysMax: prison.policyNoticeDaysMax,
          })

          expect(bookerService.getVisitorRequests).not.toHaveBeenCalled()

          expect(sessionData.bookVisitJourney).toStrictEqual({
            prisoner,
            prison,
            eligibleVisitors: visitors.eligibleVisitors,
            ineligibleVisitors: visitors.ineligibleVisitors,
          } as SessionData['bookVisitJourney'])
        })
    })

    it('should render visitor requests and add a visitor request journey start link if FEATURE_ADD_VISITOR enabled', () => {
      enableFeatureForTest('addVisitor')
      const visitorRequest = TestData.visitorRequest()
      bookerService.getVisitorRequests.mockResolvedValue([visitorRequest])

      app = appWithAllRoutes({ services: { bookerService }, sessionData })

      return request(app)
        .get(paths.BOOK_VISIT.SELECT_VISITORS)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)

          // Visitor requests
          expect($('[data-test=visitor-request-1]').text().trim()).toBe('Joan Phillips (44 years old)')

          // Link new visitor
          expect($('[data-test=link-a-visitor]').attr('href')).toBe(paths.ADD_VISITOR.START)
          expect($('[data-test=add-visitor-form]').length).toBe(0)

          expect(bookerService.getVisitorRequests).toHaveBeenCalledWith({
            bookerReference,
            prisonerNumber: prisoner.prisonerNumber,
          })
        })
    })

    it('should pre-populate with data in session', () => {
      sessionData.bookVisitJourney.selectedVisitors = [visitor1, visitor4, visitor8]

      return request(app)
        .get(paths.BOOK_VISIT.SELECT_VISITORS)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input[name=visitorDisplayIds]').length).toBe(9)
          expect($('input[name=visitorDisplayIds]:checked').length).toBe(3)
          expect($(`input[name=visitorDisplayIds][value=${visitor1.visitorDisplayId}]:checked + label`).length).toBe(1)
          expect($(`input[name=visitorDisplayIds][value=${visitor4.visitorDisplayId}]:checked + label`).length).toBe(1)
          expect($(`input[name=visitorDisplayIds][value=${visitor8.visitorDisplayId}]:checked + label`).length).toBe(1)
        })
    })

    it('should pre-populate with data in formValues overriding that in session', () => {
      sessionData.bookVisitJourney.selectedVisitors = [visitor1, visitor4, visitor8]
      const formValues = { visitorDisplayIds: [visitor2.visitorDisplayId, visitor7.visitorDisplayId] }
      flashData = { formValues: [formValues] }

      return request(app)
        .get(paths.BOOK_VISIT.SELECT_VISITORS)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input[name=visitorDisplayIds]').length).toBe(9)
          expect($('input[name=visitorDisplayIds]:checked').length).toBe(2)
          expect($(`input[name=visitorDisplayIds][value=${visitor7.visitorDisplayId}]:checked + label`).length).toBe(1)
          expect($(`input[name=visitorDisplayIds][value=${visitor2.visitorDisplayId}]:checked + label`).length).toBe(1)
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
          expect($('.govuk-error-summary a[href="#visitorDisplayIds"]').text()).toBe('No visitors selected')
          expect($('#visitorDisplayIds-error').text()).toContain('No visitors selected')
        })
    })

    it('should handle booker having no visitors for this prisoner', () => {
      bookerService.getVisitorsByEligibility.mockResolvedValue(
        (visitors = { eligibleVisitors: [], ineligibleVisitors: [] }),
      )

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

          expect(bookerService.getVisitorsByEligibility).toHaveBeenCalledWith({
            bookerReference,
            prisonerNumber: prisoner.prisonerNumber,
            policyNoticeDaysMax: prison.policyNoticeDaysMax,
          })

          expect(sessionData.bookVisitJourney).toStrictEqual({
            prisoner,
            prison,
            eligibleVisitors: [],
            ineligibleVisitors: [],
          } as SessionData['bookVisitJourney'])
        })
    })

    it('should handle booker having no eligible adult visitors for this prisoner and redirect to cannot book page with reason', () => {
      bookerService.getVisitorsByEligibility.mockResolvedValue(
        (visitors = { eligibleVisitors: [visitor6], ineligibleVisitors: [] }),
      ) // only a child visitor

      return request(app)
        .get(paths.BOOK_VISIT.SELECT_VISITORS)
        .expect(302)
        .expect('location', paths.BOOK_VISIT.CANNOT_BOOK)
        .expect(() => {
          expect(sessionData.bookVisitJourney).toStrictEqual({
            prisoner,
            prison,
            eligibleVisitors: [visitor6],
            ineligibleVisitors: [],
            cannotBookReason: 'NO_ELIGIBLE_ADULT_VISITOR',
          } as SessionData['bookVisitJourney'])
        })
    })
  })

  describe(`POST ${paths.BOOK_VISIT.SELECT_VISITORS}`, () => {
    beforeEach(() => {
      visitSessionsService.getSessionRestriction.mockResolvedValue('OPEN')

      sessionData = {
        bookVisitJourney: { prisoner, prison, eligibleVisitors: visitors.eligibleVisitors },
      } as SessionData

      app = appWithAllRoutes({ services: { visitSessionsService }, sessionData })
    })

    it('should should save selected visitors to session and redirect to select date and time page (OPEN visit)', () => {
      return request(app)
        .post(paths.BOOK_VISIT.SELECT_VISITORS)
        .send({ visitorDisplayIds: [visitor1.visitorDisplayId, visitor3.visitorDisplayId] })
        .expect(302)
        .expect('Location', paths.BOOK_VISIT.CHOOSE_TIME)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.bookVisitJourney).toStrictEqual({
            prisoner,
            prison,
            eligibleVisitors: visitors.eligibleVisitors,
            selectedVisitors: [visitor1, visitor3],
            sessionRestriction: 'OPEN',
          } as SessionData['bookVisitJourney'])
          expect(visitSessionsService.getSessionRestriction).toHaveBeenCalledWith({
            prisonerId: prisoner.prisonerNumber,
            visitorIds: [visitor1.visitorId, visitor3.visitorId],
          })
        })
    })

    it('should should save selected visitors to session and redirect to closed visit page (CLOSED visit)', () => {
      visitSessionsService.getSessionRestriction.mockResolvedValue('CLOSED')

      return request(app)
        .post(paths.BOOK_VISIT.SELECT_VISITORS)
        .send({ visitorDisplayIds: [visitor1.visitorDisplayId, visitor3.visitorDisplayId] })
        .expect(302)
        .expect('Location', paths.BOOK_VISIT.CLOSED_VISIT)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.bookVisitJourney).toStrictEqual({
            prisoner,
            prison,
            eligibleVisitors: visitors.eligibleVisitors,
            selectedVisitors: [visitor1, visitor3],
            sessionRestriction: 'CLOSED',
          } as SessionData['bookVisitJourney'])
          expect(visitSessionsService.getSessionRestriction).toHaveBeenCalledWith({
            prisonerId: prisoner.prisonerNumber,
            visitorIds: [visitor1.visitorId, visitor3.visitorId],
          })
        })
    })

    it('should filter out unrecognised or duplicate visitor IDs', () => {
      return request(app)
        .post(paths.BOOK_VISIT.SELECT_VISITORS)
        .send({
          visitorDisplayIds: [
            visitor1.visitorDisplayId,
            visitor1.visitorDisplayId,
            randomUUID(),
            visitor3.visitorDisplayId,
          ],
        })
        .expect(302)
        .expect('Location', paths.BOOK_VISIT.CHOOSE_TIME)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.bookVisitJourney).toStrictEqual({
            prisoner,
            prison,
            eligibleVisitors: visitors.eligibleVisitors,
            selectedVisitors: [visitor1, visitor3], // duplicate '1' & unrecognised UUID filtered out
            sessionRestriction: 'OPEN',
          } as SessionData['bookVisitJourney'])
          expect(visitSessionsService.getSessionRestriction).toHaveBeenCalledWith({
            prisonerId: prisoner.prisonerNumber,
            visitorIds: [visitor1.visitorId, visitor3.visitorId],
          })
        })
    })

    describe('Validation errors', () => {
      // Uses visitor age config in TestData.prisonDto()
      let expectedFlashErrors: FieldValidationError[]
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
            expect(sessionData.bookVisitJourney.selectedVisitors).toBe(undefined)
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
            expect(sessionData.bookVisitJourney.selectedVisitors).toBe(undefined)
          })
      })

      it('should set a validation error and redirect to original page when max total visitors exceeded', () => {
        const visitorDisplayIds = [
          visitor1.visitorDisplayId,
          visitor2.visitorDisplayId,
          visitor5.visitorDisplayId,
          visitor6.visitorDisplayId,
          visitor7.visitorDisplayId,
        ]
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
            expect(sessionData.bookVisitJourney.selectedVisitors).toBe(undefined)
          })
      })

      it('should set a validation error and redirect to original page when max total adult age visitors exceeded', () => {
        const visitorDisplayIds = [visitor1.visitorDisplayId, visitor2.visitorDisplayId, visitor3.visitorDisplayId]
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
            expect(sessionData.bookVisitJourney.selectedVisitors).toBe(undefined)
          })
      })

      it('should set a validation error and redirect to original page when max total child age visitors exceeded', () => {
        const visitorDisplayIds = [
          visitor5.visitorDisplayId,
          visitor6.visitorDisplayId,
          visitor7.visitorDisplayId,
          visitor8.visitorDisplayId,
        ]
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
            expect(sessionData.bookVisitJourney.selectedVisitors).toBe(undefined)
          })
      })

      it('should set a validation error and redirect to original page no visitor over 18 is selected', () => {
        const visitorDisplayIds = [visitor3.visitorDisplayId]
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
            expect(sessionData.bookVisitJourney.selectedVisitors).toBe(undefined)
          })
      })
    })
  })
})
