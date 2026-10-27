import { Router } from 'express'
import { Services } from '../../services'
import paths from '../../constants/paths'
import PrisonersController from './prisonersController'

export default function routes(services: Services): Router {
  const router = Router()

  const prisonersController = new PrisonersController(services.bookerService)

  // Prisoners and Visitors
  router.get(paths.PRISONERS, prisonersController.view())

  return router
}
