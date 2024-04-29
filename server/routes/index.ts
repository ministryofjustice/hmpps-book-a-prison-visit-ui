import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import HomeController from './homeController'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const home = new HomeController(services.bookerService)
  // TODO this should render a form with the Start button submitting form
  get('/', home.view())

  // TODO post route starts booking journey by clearing session and populating 'prisoner'
  return router
}
