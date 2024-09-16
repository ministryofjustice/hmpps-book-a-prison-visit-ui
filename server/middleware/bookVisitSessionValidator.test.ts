import type { Request, Response } from 'express'
import { NotFound } from 'http-errors'
import TestData from '../routes/testutils/testData'
import bookVisitSessionValidator from './bookVisitSessionValidator'
import paths from '../constants/paths'
import { Booker, BookingConfirmed, BookingJourney } from '../@types/bapv'
import logger from '../../logger'
import { SessionRestriction } from '../data/orchestrationApiClient'

jest.mock('../../logger')

type Method = 'GET' | 'POST'

describe('bookVisitSessionValidator', () => {
  let req: Request
  let res: Response
  const next = jest.fn()

  const bookerReference = TestData.bookerReference().value
  const prisoner = TestData.prisoner()
  const visitor = TestData.visitor()
  const sessionRestriction: SessionRestriction = 'OPEN'
  const visitSessionId = '2024-05-30_a'
  const visitSession = TestData.availableVisitSessionDto()
  const applicationReference = 'aaa-bbb-ccc'
  const visitorSupport = ''
  const mainContact = { contact: 'Some One' }

  const createMockReq = ({
    method,
    path,
    booker = { reference: bookerReference, prisoners: [prisoner] },
    bookingJourney,
    bookingConfirmed,
  }: {
    method: Method
    path: string
    booker?: Booker
    bookingJourney?: BookingJourney
    bookingConfirmed?: BookingConfirmed
  }): Request => {
    return {
      baseUrl: paths.BOOK_VISIT.ROOT,
      path: path.replace(paths.BOOK_VISIT.ROOT, ''), // strip /book-visit to replicate how routes are mounted
      method,
      session: { booker, bookingJourney, bookingConfirmed },
    } as Request
  }

  beforeEach(() => {
    jest.resetAllMocks()

    res = {
      redirect: jest.fn(),
    } as unknown as Response
  })

  it('should call next() with 404 for an unknown path', () => {
    req = createMockReq({ method: 'GET', path: '/xyz' })
    bookVisitSessionValidator()(req, res, next)
    expect(next).toHaveBeenCalledWith(new NotFound())
  })

  describe('Call next() or redirect', () => {
    const runAssertions = (expected: 'next' | 'redirect') => {
      if (expected === 'next') {
        expect(next).toHaveBeenCalledWith()
      } else {
        expect(logger.info).toHaveBeenCalled()
        expect(res.redirect).toHaveBeenCalledWith(paths.HOME)
      }
    }

    describe('booker data', () => {
      it(`POST ${paths.BOOK_VISIT.SELECT_PRISONER} should call redirect`, () => {
        req = createMockReq({
          method: 'POST',
          path: paths.BOOK_VISIT.SELECT_PRISONER,
          booker: { reference: bookerReference },
        })
        bookVisitSessionValidator()(req, res, next)
        runAssertions('redirect')
      })
    })

    describe('bookingJourney data:', () => {
      describe('no data', () => {
        it.each(<{ method: Method; path: string; expected: 'next' | 'redirect' }[]>[
          { method: 'POST', path: paths.BOOK_VISIT.SELECT_PRISONER, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.CANNOT_BOOK, expected: 'redirect' },
          { method: 'GET', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'redirect' },
          { method: 'GET', path: paths.BOOK_VISIT.CLOSED_VISIT, expected: 'redirect' },
        ])('$method $path should call $expected', ({ method, path, expected }) => {
          req = createMockReq({ method, path })
          bookVisitSessionValidator()(req, res, next)
          runAssertions(expected)
        })
      })

      describe('prisoner', () => {
        it.each(<{ method: Method; path: string; expected: 'next' | 'redirect' }[]>[
          { method: 'POST', path: paths.BOOK_VISIT.SELECT_PRISONER, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.CANNOT_BOOK, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'next' },
          { method: 'POST', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'redirect' },
          { method: 'GET', path: paths.BOOK_VISIT.CLOSED_VISIT, expected: 'redirect' },
        ])('$method $path should call $expected', ({ method, path, expected }) => {
          req = createMockReq({ method, path, bookingJourney: { prisoner } })
          bookVisitSessionValidator()(req, res, next)
          runAssertions(expected)
        })
      })

      describe('...add prison and eligibleVisitors', () => {
        it.each(<{ method: Method; path: string; expected: 'next' | 'redirect' }[]>[
          { method: 'POST', path: paths.BOOK_VISIT.SELECT_PRISONER, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.CANNOT_BOOK, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'next' },
          { method: 'POST', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.CLOSED_VISIT, expected: 'redirect' },
          { method: 'GET', path: paths.BOOK_VISIT.CHOOSE_TIME, expected: 'redirect' },
        ])('$method $path should call $expected', ({ method, path, expected }) => {
          req = createMockReq({
            method,
            path,
            bookingJourney: { prisoner, prison: TestData.prisonDto(), eligibleVisitors: [visitor] },
          })
          bookVisitSessionValidator()(req, res, next)
          runAssertions(expected)
        })
      })

      describe('...add selectedVisitors and sessionRestriction', () => {
        it.each(<{ method: Method; path: string; expected: 'next' | 'redirect' }[]>[
          { method: 'POST', path: paths.BOOK_VISIT.SELECT_PRISONER, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.CANNOT_BOOK, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'next' },
          { method: 'POST', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.CLOSED_VISIT, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.CHOOSE_TIME, expected: 'next' },
          { method: 'POST', path: paths.BOOK_VISIT.CHOOSE_TIME, expected: 'redirect' },
        ])('$method $path should call $expected', ({ method, path, expected }) => {
          req = createMockReq({
            method,
            path,
            bookingJourney: {
              prisoner,
              prison: TestData.prisonDto(),
              eligibleVisitors: [visitor],
              selectedVisitors: [visitor],
              sessionRestriction,
            },
          })
          bookVisitSessionValidator()(req, res, next)
          runAssertions(expected)
        })
      })

      describe('...add allVisitSessionIds and allVisitSessions', () => {
        it.each(<{ method: Method; path: string; expected: 'next' | 'redirect' }[]>[
          { method: 'POST', path: paths.BOOK_VISIT.SELECT_PRISONER, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.CANNOT_BOOK, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'next' },
          { method: 'POST', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.CLOSED_VISIT, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.CHOOSE_TIME, expected: 'next' },
          { method: 'POST', path: paths.BOOK_VISIT.CHOOSE_TIME, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.ADDITIONAL_SUPPORT, expected: 'redirect' },
        ])('$method $path should call $expected', ({ method, path, expected }) => {
          req = createMockReq({
            method,
            path,
            bookingJourney: {
              prisoner,
              prison: TestData.prisonDto(),
              eligibleVisitors: [visitor],
              selectedVisitors: [visitor],
              sessionRestriction,
              allVisitSessionIds: [visitSessionId],
              allVisitSessions: [visitSession],
            },
          })
          bookVisitSessionValidator()(req, res, next)
          runAssertions(expected)
        })
      })

      describe('...add selectedVisitSession and applicationReference', () => {
        it.each(<{ method: Method; path: string; expected: 'next' | 'redirect' }[]>[
          { method: 'POST', path: paths.BOOK_VISIT.SELECT_PRISONER, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.CANNOT_BOOK, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'next' },
          { method: 'POST', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.CLOSED_VISIT, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.CHOOSE_TIME, expected: 'next' },
          { method: 'POST', path: paths.BOOK_VISIT.CHOOSE_TIME, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.ADDITIONAL_SUPPORT, expected: 'next' },
          { method: 'POST', path: paths.BOOK_VISIT.ADDITIONAL_SUPPORT, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.MAIN_CONTACT, expected: 'redirect' },
        ])('$method $path should call $expected', ({ method, path, expected }) => {
          req = createMockReq({
            method,
            path,
            bookingJourney: {
              prisoner,
              prison: TestData.prisonDto(),
              eligibleVisitors: [visitor],
              selectedVisitors: [visitor],
              sessionRestriction,
              allVisitSessionIds: [visitSessionId],
              allVisitSessions: [visitSession],
              selectedVisitSession: visitSession,
              applicationReference,
            },
          })
          bookVisitSessionValidator()(req, res, next)
          runAssertions(expected)
        })
      })

      describe('...add visitorSupport', () => {
        it.each(<{ method: Method; path: string; expected: 'next' | 'redirect' }[]>[
          { method: 'POST', path: paths.BOOK_VISIT.SELECT_PRISONER, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.CANNOT_BOOK, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'next' },
          { method: 'POST', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.CLOSED_VISIT, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.CHOOSE_TIME, expected: 'next' },
          { method: 'POST', path: paths.BOOK_VISIT.CHOOSE_TIME, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.ADDITIONAL_SUPPORT, expected: 'next' },
          { method: 'POST', path: paths.BOOK_VISIT.ADDITIONAL_SUPPORT, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.MAIN_CONTACT, expected: 'next' },
          { method: 'POST', path: paths.BOOK_VISIT.MAIN_CONTACT, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.CHECK_DETAILS, expected: 'redirect' },
        ])('$method $path should call $expected', ({ method, path, expected }) => {
          req = createMockReq({
            method,
            path,
            bookingJourney: {
              prisoner,
              prison: TestData.prisonDto(),
              eligibleVisitors: [visitor],
              selectedVisitors: [visitor],
              sessionRestriction,
              allVisitSessionIds: [visitSessionId],
              allVisitSessions: [visitSession],
              selectedVisitSession: visitSession,
              applicationReference,
              visitorSupport,
            },
          })
          bookVisitSessionValidator()(req, res, next)
          runAssertions(expected)
        })
      })

      describe('...add mainContact', () => {
        it.each(<{ method: Method; path: string; expected: 'next' | 'redirect' }[]>[
          { method: 'POST', path: paths.BOOK_VISIT.SELECT_PRISONER, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.CANNOT_BOOK, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'next' },
          { method: 'POST', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.CLOSED_VISIT, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.CHOOSE_TIME, expected: 'next' },
          { method: 'POST', path: paths.BOOK_VISIT.CHOOSE_TIME, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.ADDITIONAL_SUPPORT, expected: 'next' },
          { method: 'POST', path: paths.BOOK_VISIT.ADDITIONAL_SUPPORT, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.MAIN_CONTACT, expected: 'next' },
          { method: 'POST', path: paths.BOOK_VISIT.MAIN_CONTACT, expected: 'next' },
          { method: 'GET', path: paths.BOOK_VISIT.CHECK_DETAILS, expected: 'next' },
          { method: 'POST', path: paths.BOOK_VISIT.CHECK_DETAILS, expected: 'next' },
        ])('$method $path should call $expected', ({ method, path, expected }) => {
          req = createMockReq({
            method,
            path,
            bookingJourney: {
              prisoner,
              prison: TestData.prisonDto(),
              eligibleVisitors: [visitor],
              selectedVisitors: [visitor],
              sessionRestriction,
              allVisitSessionIds: [visitSessionId],
              allVisitSessions: [visitSession],
              selectedVisitSession: visitSession,
              applicationReference,
              visitorSupport,
              mainContact,
            },
          })
          bookVisitSessionValidator()(req, res, next)
          runAssertions(expected)
        })
      })
    })

    describe('bookingConfirmed', () => {
      describe('should only allow visit booked path and POST select visitors', () => {
        it.each(<{ method: Method; path: string; expected: 'next' | 'redirect' }[]>[
          // this allowed because bookingConfirmed gets cleared in this route
          { method: 'POST', path: paths.BOOK_VISIT.SELECT_PRISONER, expected: 'next' },

          { method: 'GET', path: paths.BOOK_VISIT.CANNOT_BOOK, expected: 'redirect' },
          { method: 'GET', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'redirect' },
          { method: 'POST', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'redirect' },
          { method: 'GET', path: paths.BOOK_VISIT.CLOSED_VISIT, expected: 'redirect' },
          { method: 'GET', path: paths.BOOK_VISIT.CHOOSE_TIME, expected: 'redirect' },
          { method: 'POST', path: paths.BOOK_VISIT.CHOOSE_TIME, expected: 'redirect' },
          { method: 'GET', path: paths.BOOK_VISIT.ADDITIONAL_SUPPORT, expected: 'redirect' },
          { method: 'POST', path: paths.BOOK_VISIT.ADDITIONAL_SUPPORT, expected: 'redirect' },
          { method: 'GET', path: paths.BOOK_VISIT.MAIN_CONTACT, expected: 'redirect' },
          { method: 'POST', path: paths.BOOK_VISIT.MAIN_CONTACT, expected: 'redirect' },
          { method: 'GET', path: paths.BOOK_VISIT.CHECK_DETAILS, expected: 'redirect' },
          { method: 'POST', path: paths.BOOK_VISIT.CHECK_DETAILS, expected: 'redirect' },
          { method: 'GET', path: paths.BOOK_VISIT.BOOKED, expected: 'next' },
        ])('$method $path should call $expected', ({ method, path, expected }) => {
          req = createMockReq({
            method,
            path,
            bookingConfirmed: TestData.bookingConfirmed(),
          })
          bookVisitSessionValidator()(req, res, next)
          runAssertions(expected)
        })
      })
    })
  })
})
