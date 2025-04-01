import { RequestHandler, Router } from 'express'
import { ValidationChain } from 'express-validator'
import { Services } from '../../services'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import paths from '../../constants/paths'
import PrisonerLocationController from './prisonerLocationController'
import PrisonerDetailsController from './prisonerDetailsController'
import PrisonerAddedController from './prisonerAddedController'
import PrisonerNotMatchedController from './prisonerNotMatchedController'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const postWithValidation = (path: string | string[], validationChain: ValidationChain[], handler: RequestHandler) =>
    router.post(path, ...validationChain, asyncMiddleware(handler))

  const prisonerLocationController = new PrisonerLocationController(services.prisonService)
  const prisonerDetailsController = new PrisonerDetailsController(services.bookerService)
  const prisonerAddedController = new PrisonerAddedController()
  const prisonerNotAddedController = new PrisonerNotMatchedController()

  get(paths.ADD_PRISONER.LOCATION, prisonerLocationController.view())
  postWithValidation(
    paths.ADD_PRISONER.LOCATION,
    prisonerLocationController.validate(),
    prisonerLocationController.submit(),
  )

  get(paths.ADD_PRISONER.DETAILS, prisonerDetailsController.view())
  postWithValidation(
    paths.ADD_PRISONER.DETAILS,
    prisonerDetailsController.validate(),
    prisonerDetailsController.submit(),
  )

  get(paths.ADD_PRISONER.SUCCESS, prisonerAddedController.view())
  get(paths.ADD_PRISONER.FAIL, prisonerNotAddedController.view())

  return router
}
