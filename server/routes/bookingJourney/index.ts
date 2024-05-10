import { type RequestHandler, Router } from 'express'

import { ValidationChain } from 'express-validator'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import type { Services } from '../../services'
import SelectPrisonerController from './selectPrisonerController'
import SelectVisitorsController from './selectVisitorsController'
import DateAndTimeController from './selectDateAndTimeController'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string | string[], handler: RequestHandler) => router.post(path, asyncMiddleware(handler))
  const postWithValidation = (path: string | string[], validationChain: ValidationChain[], handler: RequestHandler) =>
    router.post(path, ...validationChain, asyncMiddleware(handler))

  const selectPrisonerController = new SelectPrisonerController()
  const selectVisitorsController = new SelectVisitorsController(services.bookerService)
  const dateAndTimeController = new DateAndTimeController(services.bookerService)

  // TODO need session checks for each stage to validate what is in session - add middleware here to apply to all booking journey routes?

  post('/select-prisoner', selectPrisonerController.selectPrisoner())

  get('/select-visitors', selectVisitorsController.view())

  postWithValidation('/select-visitors', selectVisitorsController.validate(), selectVisitorsController.submit())

  get('/select-date-and-time', dateAndTimeController.view())
  return router
}
