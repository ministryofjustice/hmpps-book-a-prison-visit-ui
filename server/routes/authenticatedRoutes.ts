import { Router } from 'express'
import type { Services } from '../services'
import paths from '../constants/paths'
import addPrisonerRoutes from './addPrisoner'
import addVisitorRoutes from './addVisitor'
import bookVisitRoutes from './bookVisit'
import visitsRoutes from './visits'
import visitorsRoutes from './visitors'
import { clearSession } from '../utils/utils'

export default function routes(services: Services): Router {
  const router = Router()

  router.get(paths.RETURN_HOME, (req, res) => {
    clearSession(req)
    res.redirect(paths.VISITS.HOME)
  })

  router.use(addPrisonerRoutes(services))

  router.use(addVisitorRoutes(services))

  router.use(bookVisitRoutes(services))
  router.use(visitsRoutes(services))
  router.use(visitorsRoutes(services))

  return router
}
