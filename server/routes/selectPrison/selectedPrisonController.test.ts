import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import { createMockPrisonService } from '../../services/testutils/mocks'
import { enableFeatureForTest } from '../../data/testutils/mockFeatureFlags'

let app: Express
let sessionData: SessionData

const prison = TestData.prisonDto()
const prisonService = createMockPrisonService()

beforeEach(() => {
  enableFeatureForTest('visitRequest')

  sessionData = {} as SessionData
  prisonService.getPrison.mockResolvedValue(prison)

  app = appWithAllRoutes({ services: { prisonService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Visiting selected prison page', () => {
  describe(`GET ${paths.SELECTED_PRISON}`, () => {
    it('should render visiting selected prison page', () => {
      sessionData.selectedPrisonId = 'HEI'

      return request(app)
        .get(paths.SELECTED_PRISON)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visiting Hewell \(HMP\) -/)
          expect($('#navigation').length).toBe(0)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.SELECT_PRISON)
          expect($('h1').text().trim()).toBe('Visiting Hewell (HMP)')

          expect($('[data-test="continue-button"]').text().trim()).toBe('Continue')
          expect($('[data-test="continue-button"]').attr('href')).toBe(paths.SIGN_IN)

          expect(prisonService.getPrison).toHaveBeenCalledWith(sessionData.selectedPrisonId)
        })
    })

    it('should redirect to select prison page if selected prison not set in session', () => {
      return request(app)
        .get(paths.SELECTED_PRISON)
        .expect(302)
        .expect('Location', paths.SELECT_PRISON)
        .expect(() => {
          expect(prisonService.getPrison).not.toHaveBeenCalled()
        })
    })
  })
})
