import { Router } from 'express'
import paths from '../../constants/paths'
import AddVisitorStartController from './addVisitorStartController'
import config from '../../config'

export default function routes(): Router {
  const router = Router()

  const addVisitorStartController = new AddVisitorStartController()

  if (config.features.addVisitor) {
    router.get(paths.ADD_VISITOR.START, addVisitorStartController.view())
  }

  return router
}
