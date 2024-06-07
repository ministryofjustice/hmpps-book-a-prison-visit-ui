import { type RequestHandler, Router } from 'express'

import { ValidationChain } from 'express-validator'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import type { Services } from '../../services'
import SelectPrisonerController from './selectPrisonerController'
import SelectVisitorsController from './selectVisitorsController'
import ChooseVisitTimeController from './chooseVisitTimeController'
import AdditionalSupportController from './additionalSupportController'
import MainContactController from './mainContactController'
import CheckVisitDetailsController from './checkVisitDetailsController'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string | string[], handler: RequestHandler) => router.post(path, asyncMiddleware(handler))
  const postWithValidation = (path: string | string[], validationChain: ValidationChain[], handler: RequestHandler) =>
    router.post(path, ...validationChain, asyncMiddleware(handler))

  const selectPrisonerController = new SelectPrisonerController()
  const selectVisitorsController = new SelectVisitorsController(services.bookerService, services.prisonService)
  const chooseVisitTimeController = new ChooseVisitTimeController(services.visitService, services.visitSessionsService)
  const additionalSupportController = new AdditionalSupportController()
  const mainContactController = new MainContactController()
  const checkVisitDetailsController = new CheckVisitDetailsController()

  // TODO need session checks for each stage to validate what is in session - add middleware here to apply to all booking journey routes?

  post('/select-prisoner', selectPrisonerController.selectPrisoner())

  get('/select-visitors', selectVisitorsController.view())

  postWithValidation('/select-visitors', selectVisitorsController.validate(), selectVisitorsController.submit())

  get('/choose-visit-time', chooseVisitTimeController.view())
  postWithValidation('/choose-visit-time', chooseVisitTimeController.validate(), chooseVisitTimeController.submit())

  get('/additional-support', additionalSupportController.view())

  postWithValidation(
    '/additional-support',
    additionalSupportController.validate(),
    additionalSupportController.submit(),
  )

  get('/main-contact', mainContactController.view())

  postWithValidation('/main-contact', mainContactController.validate(), mainContactController.submit())

  get('/check-visit-details', checkVisitDetailsController.view())

  return router
}
