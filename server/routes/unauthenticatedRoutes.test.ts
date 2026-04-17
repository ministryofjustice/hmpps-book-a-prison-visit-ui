import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import paths from '../constants/paths'
import config from '../config'

let app: Express

afterEach(() => {
  jest.resetAllMocks()
})

describe('/ - root path redirect', () => {
  it('should redirect authenticated users to Visits home page', () => {
    app = appWithAllRoutes({})
    return request(app).get(paths.ROOT).expect(302).expect('location', paths.VISITS.HOME)
  })

  it('should redirect unauthenticated users to configured ROOT_PATH_REDIRECT', () => {
    app = appWithAllRoutes({ userSupplier: () => undefined })
    return request(app).get(paths.ROOT).expect(302).expect('location', config.rootPathRedirect)
  })
})

describe('/select-prison', () => {
  // Full tests for this route in ./server/routes/selectPrison
  it('should render select prison page', () => {
    app = appWithAllRoutes({})
    return request(app)
      .get(paths.SELECT_PRISON)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Which prison are you visiting\? -/)
      })
  })
})
