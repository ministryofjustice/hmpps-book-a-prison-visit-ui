import { Router } from 'express'
import paths from '../../constants/paths'
import AddVisitorStartController from './addVisitorStartController'
import VisitorDetailsController from './visitorDetailsController'

export default function routes(): Router {
  const router = Router()

  const addVisitorStartController = new AddVisitorStartController()
  const visitorDetailsController = new VisitorDetailsController()

  router.get(paths.ADD_VISITOR.START, addVisitorStartController.view())

  router.get(paths.ADD_VISITOR.DETAILS, visitorDetailsController.view())
  router.post(paths.ADD_VISITOR.DETAILS, visitorDetailsController.validate(), visitorDetailsController.submit())

  return router
}
