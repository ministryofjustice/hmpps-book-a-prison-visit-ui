import { Router } from 'express'
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

  router.post(paths.BOOK_VISIT.SELECT_PRISONER, selectPrisonerController.selectPrisoner())

  router.get(paths.BOOK_VISIT.CANNOT_BOOK, cannotBookController.view())

  router.get(paths.BOOK_VISIT.SELECT_VISITORS, selectVisitorsController.view())
  router.post(paths.BOOK_VISIT.SELECT_VISITORS, selectVisitorsController.validate(), selectVisitorsController.submit())

  router.get(paths.BOOK_VISIT.CLOSED_VISIT, closedVisitController.view())

  router.get(paths.BOOK_VISIT.CHOOSE_TIME, chooseVisitTimeController.view())
  router.post(paths.BOOK_VISIT.CHOOSE_TIME, chooseVisitTimeController.validate(), chooseVisitTimeController.submit())

  router.get(paths.BOOK_VISIT.ADDITIONAL_SUPPORT, additionalSupportController.view())
  router.post(
    paths.BOOK_VISIT.ADDITIONAL_SUPPORT,
    additionalSupportController.validate(),
    additionalSupportController.submit(),
  )

  router.get(paths.BOOK_VISIT.MAIN_CONTACT, mainContactController.view())
  router.post(paths.BOOK_VISIT.MAIN_CONTACT, mainContactController.validate(), mainContactController.submit())

  router.get(paths.BOOK_VISIT.CONTACT_DETAILS, contactDetailsController.view())
  router.post(paths.BOOK_VISIT.CONTACT_DETAILS, contactDetailsController.validate(), contactDetailsController.submit())

  router.get(paths.BOOK_VISIT.CHECK_DETAILS, checkVisitDetailsController.view())
  router.post(paths.BOOK_VISIT.CHECK_DETAILS, checkVisitDetailsController.submit())

  router.get(paths.BOOK_VISIT.BOOKED, visitBookedController.view())
  return router
}
