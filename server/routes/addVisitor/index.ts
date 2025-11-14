import { Router } from 'express'
import paths from '../../constants/paths'
import AddVisitorStartController from './addVisitorStartController'

export default function routes(): Router {
  const router = Router()

  const addVisitorStartController = new AddVisitorStartController()

  router.get(paths.ADD_VISITOR.START, addVisitorStartController.view())

  return router
}
