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
const prisonerWithoutVOs = TestData.prisoner({ availableVos: -1 })

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
        bookingJourney: {
          prisoner: prisonerWithoutVOs,
          cannotBookReason: 'NO_VO_BALANCE',
        },
      } as SessionData

      app = appWithAllRoutes({ sessionData })
    })

    it('should use the session validation middleware', () => {
      sessionData.bookingJourney.cannotBookReason = undefined

      return request(app)
        .get(paths.BOOK_VISIT.CANNOT_BOOK)
        .expect(302)
        .expect('Location', paths.HOME)
        .expect(res => {
          expect(logger.info).toHaveBeenCalledWith(expect.stringMatching('Session validation failed'))
        })
    })

    it('should render cannot book page and clear bookingJourney data - NO_VO_BALANCE', () => {
      return request(app)
        .get(paths.BOOK_VISIT.CANNOT_BOOK)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^A visit cannot be booked -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.HOME)
          expect($('h1').text()).toBe('A visit cannot be booked')

          expect($('[data-test=prisoner-name]').text()).toBe('John Smith')
          expect($('main p').eq(0).text()).toContain('has used their allowance of visits')
          expect($('[data-test=book-from-date]').text().trim()).toBe('Monday 1 July 2024')

          expect(sessionData.bookingJourney).toBe(undefined)
        })
    })
  })
})
