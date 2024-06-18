import type { Request, Response } from 'express'
import { NotFound } from 'http-errors'
import TestData from '../routes/testutils/testData'
import bookVisitSessionValidator from './bookVisitSessionValidator'
import paths from '../constants/paths'
import { Booker, BookingJourney } from '../@types/bapv'
import logger from '../../logger'

jest.mock('../../logger')

type Method = 'GET' | 'POST'

describe('bookVisitSessionValidator', () => {
  let req: Request
  let res: Response
  const next = jest.fn()

  const bookerReference = TestData.bookerReference().value
  const prisoner = TestData.prisoner()

  const createMockReq = ({
    method = 'GET',
    path,
    booker = { reference: bookerReference, prisoners: [prisoner] },
    bookingJourney,
  }: {
    method?: Method
    path: string
    booker?: Booker
    bookingJourney?: BookingJourney
  }): Request => {
    return {
      baseUrl: paths.BOOK_VISIT.ROOT,
      path: path.replace(paths.BOOK_VISIT.ROOT, ''), // strip /book-visit to replicate how routes are mounted
      method,
      session: { booker, bookingJourney },
    } as Request
  }

  beforeEach(() => {
    jest.resetAllMocks()

    res = {
      redirect: jest.fn(),
    } as unknown as Response
  })

  it('should call next() with 404 for an unknown path', () => {
    req = createMockReq({ path: '/xyz' })
    bookVisitSessionValidator()(req, res, next)
    expect(next).toHaveBeenCalledWith(new NotFound())
  })

  it('should log and redirect if booker has no prisoner', () => {
    req = createMockReq({ path: paths.BOOK_VISIT.SELECT_PRISONER, booker: { reference: bookerReference } })
    bookVisitSessionValidator()(req, res, next)
    expect(logger.info).toHaveBeenCalled()
    expect(res.redirect).toHaveBeenCalledWith(paths.HOME)
  })

  describe('BookingJourney session data contains:', () => {
    const runAssertions = (expected: 'next' | 'redirect') => {
      if (expected === 'next') {
        expect(next).toHaveBeenCalledWith()
      } else {
        expect(logger.info).toHaveBeenCalled()
        expect(res.redirect).toHaveBeenCalledWith(paths.HOME)
      }
    }

    describe('no data', () => {
      it.each(<{ method: Method; path: string; expected: 'next' | 'redirect' }[]>[
        { method: 'POST', path: paths.BOOK_VISIT.SELECT_PRISONER, expected: 'next' },
        { method: 'GET', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'redirect' },
      ])('$method $path should call $expected', ({ method, path, expected }) => {
        req = createMockReq({ method, path })
        bookVisitSessionValidator()(req, res, next)
        runAssertions(expected)
      })
    })

    describe('prisoner', () => {
      it.each(<{ method: Method; path: string; expected: 'next' | 'redirect' }[]>[
        { method: 'POST', path: paths.BOOK_VISIT.SELECT_PRISONER, expected: 'next' },
        { method: 'GET', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'next' },
        { method: 'POST', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'redirect' },
      ])('$method $path should call $expected', ({ method, path, expected }) => {
        req = createMockReq({ method, path, bookingJourney: { prisoner } })
        bookVisitSessionValidator()(req, res, next)
        runAssertions(expected)
      })
    })

    describe('prison and allVisitors', () => {
      it.each(<{ method: Method; path: string; expected: 'next' | 'redirect' }[]>[
        { method: 'POST', path: paths.BOOK_VISIT.SELECT_PRISONER, expected: 'next' },
        { method: 'GET', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'next' },
        { method: 'POST', path: paths.BOOK_VISIT.SELECT_VISITORS, expected: 'next' },
      ])('$method $path should call $expected', ({ method, path, expected }) => {
        req = createMockReq({
          method,
          path,
          bookingJourney: { prisoner, prison: TestData.prisonDto(), allVisitors: [TestData.visitor()] },
        })
        bookVisitSessionValidator()(req, res, next)
        runAssertions(expected)
      })
    })

    // TODO
  })
})
