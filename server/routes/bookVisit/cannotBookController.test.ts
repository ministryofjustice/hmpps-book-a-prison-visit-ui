import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import logger from '../../../logger'

jest.mock('../../../logger')

let app: Express

let sessionData: SessionData

const bookerReference = TestData.bookerReference().value
const prisonerWithoutVOs = TestData.prisoner({
  availableVos: -1,
  registeredPrisonId: 'CFI',
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('A visit cannot be booked', () => {
  describe(`GET ${paths.BOOK_VISIT.CANNOT_BOOK}`, () => {
    beforeEach(() => {
      sessionData = {
        booker: {
          reference: bookerReference,
          prisoners: [prisonerWithoutVOs],
        },
        bookVisitJourney: {
          prisoner: prisonerWithoutVOs,
        },
      } as SessionData

      app = appWithAllRoutes({ sessionData })
    })

    it('should use the session validation middleware', () => {
      return request(app)
        .get(paths.BOOK_VISIT.CANNOT_BOOK)
        .expect(302)
        .expect('Location', paths.VISITS.HOME)
        .expect(res => {
          expect(logger.info).toHaveBeenCalledWith(expect.stringMatching('Session validation failed'))
        })
    })

    it('should render cannot book page and clear bookVisitJourney data - NO_VO_BALANCE', () => {
      sessionData.bookVisitJourney!.cannotBookReason = 'NO_VO_BALANCE'

      return request(app)
        .get(paths.BOOK_VISIT.CANNOT_BOOK)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^A visit cannot be booked -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.VISITS.HOME)
          expect($('h1').text()).toBe('A visit cannot be booked')

          expect($('[data-test=cannot-book-reason]').text()).toBe(
            'John Smith has used their allowance of visits for this month.',
          )
          expect($('[data-test=book-from-date]').text()).toContain('Monday 1 July 2024')

          expect(sessionData.bookVisitJourney).toBe(undefined)
        })
    })

    it('should render cannot book page and clear bookVisitJourney data - TRANSFER_OR_RELEASE', () => {
      sessionData.bookVisitJourney!.cannotBookReason = 'TRANSFER_OR_RELEASE'

      return request(app)
        .get(paths.BOOK_VISIT.CANNOT_BOOK)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^A visit cannot be booked -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.VISITS.HOME)
          expect($('h1').text()).toBe('A visit cannot be booked')

          expect($('[data-test=cannot-book-reason]').text()).toBe(
            'John Smith is no longer at Cardiff (HMP & YOI). They may have moved to another prison or been released.',
          )

          expect(sessionData.bookVisitJourney).toBe(undefined)
        })
    })

    it('should render cannot book page and clear bookVisitJourney data - UNSUPPORTED_PRISON', () => {
      sessionData.bookVisitJourney!.cannotBookReason = 'UNSUPPORTED_PRISON'

      return request(app)
        .get(paths.BOOK_VISIT.CANNOT_BOOK)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^A visit cannot be booked -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.VISITS.HOME)
          expect($('h1').text()).toBe('A visit cannot be booked')

          expect($('[data-test=cannot-book-reason]').text()).toBe(
            'John Smith is at Cardiff (HMP & YOI). This prison is not currently supported by this service.',
          )

          expect(sessionData.bookVisitJourney).toBe(undefined)
        })
    })

    it('should render cannot book page and clear bookVisitJourney data - NO_ELIGIBLE_ADULT_VISITOR', () => {
      sessionData.bookVisitJourney!.cannotBookReason = 'NO_ELIGIBLE_ADULT_VISITOR'

      return request(app)
        .get(paths.BOOK_VISIT.CANNOT_BOOK)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^A visit cannot be booked -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.VISITS.HOME)
          expect($('h1').text()).toBe('A visit cannot be booked')

          expect($('[data-test="cannot-book-reason"]').text()).toContain(
            'One person on a visit must be 18 years old or older',
          )

          expect(sessionData.bookVisitJourney).toBe(undefined)
        })
    })
  })
})
