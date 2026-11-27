import { RequestHandler } from 'express'
import { matchedData, ValidationChain, validationResult } from 'express-validator'
import { UUID } from 'crypto'
import { BookerService } from '../../services'
import paths from '../../constants/paths'
import { buildVisitorRequestsTableRows, buildVisitorsTableRows } from './visitorsUtils'
import type { Locale } from '../../constants/locales'
import { validatePrisonerDisplayId } from './validations'

export default class VisitorsController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const booker = req.session.booker!

      if (!booker.prisoners?.length) {
        return res.redirect(paths.VISITS.HOME)
      }

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.redirect(paths.VISITS.HOME)
      }

      const { prisonerDisplayId } = matchedData<{ prisonerDisplayId: UUID }>(req)
      if (!prisonerDisplayId) {
        /// TODO remove original visitors path: currently only for supporting exisitng visitors path redirect to prisoners page
        return res.redirect(paths.PRISONERS)
      }

      const prisoner = booker.prisoners.find(p => p.prisonerDisplayId === prisonerDisplayId)!

      const [visitors, visitorRequests] = await Promise.all([
        this.bookerService.getVisitors(booker.reference, prisoner.prisonerNumber),
        this.bookerService.getVisitorRequests({
          bookerReference: booker.reference,
          prisonerNumber: prisoner.prisonerNumber,
        }),
      ])

      req.session.visitorRequests = visitorRequests

      const visitorsTableRows = buildVisitorsTableRows({ visitors, t: req.t, lng: req.language as Locale })
      const visitorRequestsTableRows = buildVisitorRequestsTableRows({
        visitors: visitorRequests,
        t: req.t,
        lng: req.language as Locale,
        includeCancelLink: true,
      })

      return res.render('pages/visitors/visitors', {
        messages: req.flash('messages') ?? [],
        prisoner,
        visitorsTableRows,
        visitorRequestsTableRows,
        showOLServiceNav: true,
      })
    }
  }

  public validate(): ValidationChain[] {
    return [validatePrisonerDisplayId]
  }
}
