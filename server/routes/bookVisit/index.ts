import { type RequestHandler, Router } from 'express'

import { ValidationChain } from 'express-validator'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import type { Services } from '../../services'
import SelectPrisonerController from './selectPrisonerController'
import SelectVisitorsController from './selectVisitorsController'
import ChooseVisitTimeController from './chooseVisitTimeController'
import AdditionalSupportController from './additionalSupportController'
import MainContactController from './mainContactController'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string | string[], handler: RequestHandler) => router.post(path, asyncMiddleware(handler))
  const postWithValidation = (path: string | string[], validationChain: ValidationChain[], handler: RequestHandler) =>
    router.post(path, ...validationChain, asyncMiddleware(handler))

  const selectPrisonerController = new SelectPrisonerController()
  const selectVisitorsController = new SelectVisitorsController(services.bookerService, services.prisonService)
  const selectVisitDateTimeController = new ChooseVisitTimeController(
    services.visitService,
    services.visitSessionsService,
  )
  const selectAdditionalSupportController = new AdditionalSupportController()
  const selectMainContactController = new MainContactController()

  // TODO need session checks for each stage to validate what is in session - add middleware here to apply to all booking journey routes?

  post('/select-prisoner', selectPrisonerController.selectPrisoner())

  get('/select-visitors', selectVisitorsController.view())

  postWithValidation('/select-visitors', selectVisitorsController.validate(), selectVisitorsController.submit())

  get('/choose-visit-time', selectVisitDateTimeController.view())
  postWithValidation(
    '/choose-visit-time',
    selectVisitDateTimeController.validate(),
    selectVisitDateTimeController.submit(),
  )

  get('/additional-support', selectAdditionalSupportController.view())

  postWithValidation(
    '/additional-support',
    selectAdditionalSupportController.validate(),
    selectAdditionalSupportController.submit(),
  )

  get('/main-contact', selectMainContactController.view())

  return router
}