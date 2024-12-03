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
import VisitBookedController from './visitBookedController'
import paths from '../../constants/paths'
import bookVisitSessionValidator from '../../middleware/bookVisitSessionValidator'
import CannotBookController from './cannotBookController'
import ClosedVisitController from './closedVisitController'
import ContactDetailsController from './contactDetailsController'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string | string[], handler: RequestHandler) => router.post(path, asyncMiddleware(handler))
  const postWithValidation = (path: string | string[], validationChain: ValidationChain[], handler: RequestHandler) =>
    router.post(path, ...validationChain, asyncMiddleware(handler))

  const selectPrisonerController = new SelectPrisonerController(services.bookerService)
  const cannotBookController = new CannotBookController()
  const selectVisitorsController = new SelectVisitorsController(
    services.bookerService,
    services.prisonService,
    services.visitSessionsService,
  )
  const closedVisitController = new ClosedVisitController()
  const chooseVisitTimeController = new ChooseVisitTimeController(services.visitService, services.visitSessionsService)
  const additionalSupportController = new AdditionalSupportController()
  const mainContactController = new MainContactController()
  const contactDetailsController = new ContactDetailsController(services.visitService)
  const checkVisitDetailsController = new CheckVisitDetailsController(services.visitService)
  const visitBookedController = new VisitBookedController()

  router.use(paths.BOOK_VISIT.ROOT, bookVisitSessionValidator())

  post(paths.BOOK_VISIT.SELECT_PRISONER, selectPrisonerController.selectPrisoner())

  get(paths.BOOK_VISIT.CANNOT_BOOK, cannotBookController.view())

  get(paths.BOOK_VISIT.SELECT_VISITORS, selectVisitorsController.view())
  postWithValidation(
    paths.BOOK_VISIT.SELECT_VISITORS,
    selectVisitorsController.validate(),
    selectVisitorsController.submit(),
  )

  get(paths.BOOK_VISIT.CLOSED_VISIT, closedVisitController.view())

  get(paths.BOOK_VISIT.CHOOSE_TIME, chooseVisitTimeController.view())
  postWithValidation(
    paths.BOOK_VISIT.CHOOSE_TIME,
    chooseVisitTimeController.validate(),
    chooseVisitTimeController.submit(),
  )

  get(paths.BOOK_VISIT.ADDITIONAL_SUPPORT, additionalSupportController.view())
  postWithValidation(
    paths.BOOK_VISIT.ADDITIONAL_SUPPORT,
    additionalSupportController.validate(),
    additionalSupportController.submit(),
  )

  get(paths.BOOK_VISIT.MAIN_CONTACT, mainContactController.view())
  postWithValidation(paths.BOOK_VISIT.MAIN_CONTACT, mainContactController.validate(), mainContactController.submit())

  get(paths.BOOK_VISIT.CONTACT_DETAILS, contactDetailsController.view())
  postWithValidation(
    paths.BOOK_VISIT.CONTACT_DETAILS,
    contactDetailsController.validate(),
    contactDetailsController.submit(),
  )

  get(paths.BOOK_VISIT.CHECK_DETAILS, checkVisitDetailsController.view())
  post(paths.BOOK_VISIT.CHECK_DETAILS, checkVisitDetailsController.submit())

  get(paths.BOOK_VISIT.BOOKED, visitBookedController.view())
  return router
}
