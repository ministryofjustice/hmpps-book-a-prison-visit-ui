import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import paths from '../constants/paths'
import { createMockPrisonService } from '../services/testutils/mocks'
import config from '../config'

let app: Express
let userSupplier: () => Express.User
const prisonService = createMockPrisonService()

afterEach(() => {
  jest.resetAllMocks()
})

describe('/ - root path redirect', () => {
  it('should redirect authenticated users to service home page', () => {
    app = appWithAllRoutes({})
    return request(app).get(paths.ROOT).expect(302).expect('location', paths.HOME)
  })

  it('should redirect unauthenticated users to configured ROOT_PATH_REDIRECT', () => {
    userSupplier = () => undefined
    app = appWithAllRoutes({ userSupplier })
    return request(app).get(paths.ROOT).expect(302).expect('location', config.rootPathRedirect)
  })
})

describe('/select-prison', () => {
  // Full tests for this route in ./server/routes/selectPrison
  it('should render select prison page', () => {
    prisonService.getAllPrisonNames.mockResolvedValue([])

    app = appWithAllRoutes({ services: { prisonService } })
    return request(app)
      .get(paths.SELECT_PRISON)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Which prison are you visiting\? -/)
      })
  })
})
