import { Router } from 'express'
import { Services } from '../../services'
import paths from '../../constants/paths'
import PrisonerLocationController from './prisonerLocationController'
import PrisonerDetailsController from './prisonerDetailsController'
import PrisonerAddedController from './prisonerAddedController'
import PrisonerNotMatchedController from './prisonerNotMatchedController'

export default function routes(services: Services): Router {
  const router = Router()

  const prisonerLocationController = new PrisonerLocationController(services.prisonService)
  const prisonerDetailsController = new PrisonerDetailsController(services.bookerService)
  const prisonerAddedController = new PrisonerAddedController()
  const prisonerNotAddedController = new PrisonerNotMatchedController()

  router.get(paths.ADD_PRISONER.LOCATION, prisonerLocationController.view())
  router.post(paths.ADD_PRISONER.LOCATION, prisonerLocationController.validate(), prisonerLocationController.submit())

  router.get(paths.ADD_PRISONER.DETAILS, prisonerDetailsController.view())
  router.post(paths.ADD_PRISONER.DETAILS, prisonerDetailsController.validate(), prisonerDetailsController.submit())

  router.get(paths.ADD_PRISONER.SUCCESS, prisonerAddedController.view())
  router.get(paths.ADD_PRISONER.FAIL, prisonerNotAddedController.view())

  return router
}
