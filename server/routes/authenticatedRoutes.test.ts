import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from './testutils/appSetup'
import paths from '../constants/paths'
import * as utils from '../utils/utils'

let app: Express
let sessionData: SessionData

beforeEach(() => {
  sessionData = {} as SessionData
  app = appWithAllRoutes({ sessionData })
})

describe('Return to Visit home page redirect', () => {
  it('should call clearSession() and redirect to visits home', () => {
    const clearSession = jest.spyOn(utils, 'clearSession')

    return request(app)
      .get(paths.RETURN_HOME)
      .expect(302)
      .expect('Location', paths.VISITS.HOME)
      .expect(() => {
        expect(clearSession).toHaveBeenCalled()
      })
  })
})
