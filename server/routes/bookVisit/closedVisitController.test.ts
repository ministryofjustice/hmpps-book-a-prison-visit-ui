import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import logger from '../../../logger'
import { SessionRestriction } from '../../data/orchestrationApiClient'

jest.mock('../../../logger')

let app: Express

let sessionData: SessionData

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner()
const prison = TestData.prisonDto()
const visitor = TestData.visitor()
const sessionRestriction: SessionRestriction = 'OPEN'

afterEach(() => {
  jest.resetAllMocks()
})

describe('Closed visit', () => {
  describe(`GET ${paths.BOOK_VISIT.CLOSED_VISIT}`, () => {
    beforeEach(() => {
      sessionData = {
        booker: { reference: bookerReference, prisoners: [prisoner] },
        bookVisitJourney: {
          prisoner,
          prison,
          eligibleVisitors: [visitor],
          selectedVisitors: [visitor],
          sessionRestriction,
        },
      } as SessionData

      app = appWithAllRoutes({ sessionData })
    })

    it('should use the session validation middleware', () => {
      sessionData.bookVisitJourney.prisoner = undefined

      return request(app)
        .get(paths.BOOK_VISIT.CLOSED_VISIT)
        .expect(302)
        .expect('Location', paths.HOME)
        .expect(res => {
          expect(logger.info).toHaveBeenCalledWith(expect.stringMatching('Session validation failed'))
        })
    })

    it('should render page with closed visit interruption card', () => {
      return request(app)
        .get(paths.BOOK_VISIT.CLOSED_VISIT)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^This will be a closed visit -/)
          expect($('#navigation').length).toBe(0)
          expect($('[data-test="back-link"]').length).toBe(0)

          expect($('h1').text()).toBe('This will be a closed visit')
          expect($('p').text()).toContain('On a closed visit, ')

          expect($('[data-test=closed-visit-continue]').text().trim()).toBe('Continue to book')
          expect($('[data-test=closed-visit-continue]').attr('href')).toBe(paths.BOOK_VISIT.CHOOSE_TIME)

          expect($(`a[href=${paths.RETURN_HOME}]`).text().trim()).toBe('Cancel and return to the homepage')
        })
    })
  })
})
