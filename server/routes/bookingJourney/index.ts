import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../../middleware/asyncMiddleware'
import type { Services } from '../../services'
import SelectPrisonerController from './selectPrisonerController'
import SelectVisitorsController from './selectVisitorsController'
import DateAndTimeController from '../../views/pages/bookingJourney/dateAndTimeController'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string | string[], handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  const selectPrisonerController = new SelectPrisonerController()
  const selectVisitorsController = new SelectVisitorsController(services.bookerService)
  const dateAndTimeController = new DateAndTimeController(services.bookerService)

  // TODO need session checks for each stage to validate what is in session
  post('/select-prisoner', selectPrisonerController.selectPrisoner())

  get('/select-visitors', selectVisitorsController.view())

  post('/select-visitors', selectVisitorsController.submit())

  get('/date-and-time', dateAndTimeController.view())
  return router
}
