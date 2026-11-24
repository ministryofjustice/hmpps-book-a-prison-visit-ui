import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import paths from '../../constants/paths'

let app: Express
let sessionData: SessionData

beforeEach(() => {
  sessionData = {
    addPrisonerJourneyResult: {
      selectedPrisonId: 'HEI',
      prisonerNumber: 'A1234BC',
    },
  } as SessionData

  app = appWithAllRoutes({ sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Prisoner not matched', () => {
  describe(`GET ${paths.ADD_PRISONER.FAIL}`, () => {
    it('should redirect to Visits home page if add prisoner failure not set in session', () => {
      return request(app).get(paths.ADD_PRISONER.FAIL).expect(302).expect('Location', paths.RETURN_HOME)
    })

    it('should render prisoner details do not match page', () => {
      sessionData.addPrisonerJourneyResult!.result = 'FAILED_REGISTRATION'

      return request(app)
        .get(paths.ADD_PRISONER.FAIL)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Prisoner details do not match -/)
          expect($('#navigation').length).toBe(1)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.ADD_PRISONER.DETAILS)
          expect($('h1').text()).toBe('Prisoner details do not match')
          expect($('[data-test=no-match-at-prison]').text()).toContain('Hewell (HMP & YOI)')
          expect($('[data-test=check-details] a').attr('href')).toBe(paths.ADD_PRISONER.DETAILS)
        })
    })

    it('should render prisoner already linked page', () => {
      sessionData.addPrisonerJourneyResult!.result = 'PRISONER_ALREADY_REGISTERED_AGAINST_BOOKER'

      return request(app)
        .get(paths.ADD_PRISONER.FAIL_ALREADY_LINKED)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Prisoner already linked -/)
          expect($('#navigation').length).toBe(1)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.ADD_PRISONER.DETAILS)
          expect($('h1').text()).toBe('Prisoner already linked')
          expect($('[data-test=already-linked]').text()).toContain('John Smith')
          expect($('[data-test=book-a-visit]').attr('href')).toBe(paths.VISITS.HOME)
          expect($('[data-test=view-linked-prisoners]').attr('href')).toBe(paths.PRISONERS)
        })
    })
  })
})
