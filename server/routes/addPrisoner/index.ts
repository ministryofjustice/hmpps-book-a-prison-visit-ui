import { RequestHandler, Router } from 'express'
import { ValidationChain } from 'express-validator'
import { Services } from '../../services'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import paths from '../../constants/paths'
import PrisonerLocationController from './prisonerLocationController'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const postWithValidation = (path: string | string[], validationChain: ValidationChain[], handler: RequestHandler) =>
    router.post(path, ...validationChain, asyncMiddleware(handler))

  const prisonerLocationController = new PrisonerLocationController(services.prisonService)

  get(paths.ADD_PRISONER.LOCATION, prisonerLocationController.view())
  postWithValidation(
    paths.ADD_PRISONER.LOCATION,
    prisonerLocationController.validate(),
    prisonerLocationController.submit(),
  )

  return router
}
