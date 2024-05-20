import { type RequestHandler, Router } from 'express'

import { ValidationChain } from 'express-validator'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import type { Services } from '../../services'
import SelectPrisonerController from './selectPrisonerController'
import SelectVisitorsController from './selectVisitorsController'
import DateAndTimeController from './selectDateAndTimeController'
import AdditionalSupportController from './selectAdditionalSupportController'
import MainContactController from './selectMainContactController'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string | string[], handler: RequestHandler) => router.post(path, asyncMiddleware(handler))
  const postWithValidation = (path: string | string[], validationChain: ValidationChain[], handler: RequestHandler) =>
    router.post(path, ...validationChain, asyncMiddleware(handler))

  const selectPrisonerController = new SelectPrisonerController()
  const selectVisitorsController = new SelectVisitorsController(services.bookerService, services.prisonService)
  const dateAndTimeController = new DateAndTimeController(services.bookerService)
  const additionalSupportController = new AdditionalSupportController(services.bookerService)
  const mainContactController = new MainContactController(services.bookerService)

  // TODO need session checks for each stage to validate what is in session - add middleware here to apply to all booking journey routes?

  post('/select-prisoner', selectPrisonerController.selectPrisoner())

  get('/select-visitors', selectVisitorsController.view())

  postWithValidation('/select-visitors', selectVisitorsController.validate(), selectVisitorsController.submit())

  get('/select-date-and-time', dateAndTimeController.view())

  get('/select-additional-support', additionalSupportController.view())

  postWithValidation(
    '/select-additional-support',
    additionalSupportController.validate(),
    additionalSupportController.submit(),
  )

  get('/select-main-contact', mainContactController.view())

  return router
}
