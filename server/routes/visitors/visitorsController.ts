import { Request, RequestHandler } from 'express'
import { BookerService } from '../../services'
import paths from '../../constants/paths'
import {
  buildVisitorRequestsTableRows,
  buildVisitorRequestsTableRowsWithCancellationLink,
  buildVisitorsTableRows,
} from './visitorsUtils'
import type { Locale } from '../../constants/locales'
import config from '../../config'
import { GOVUKTableRow } from '../../@types/bapv'
import { BookerPrisonerVisitorRequestDetail } from '../../services/bookerService'

export default class VisitorsController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const booker = req.session.booker!

      if (!booker.prisoners?.length) {
        return res.redirect(paths.VISITS.HOME)
      }

      const prisoner = booker.prisoners[0]

      const [visitors, visitorRequests] = await Promise.all([
        this.bookerService.getVisitors(booker.reference, prisoner.prisonerNumber),
        this.bookerService.getVisitorRequests({
          bookerReference: booker.reference,
          prisonerNumber: prisoner.prisonerNumber,
        }),
      ])

      const visitorRequestsTableRows = this.buildVisitorRequestsTableRows(req, visitorRequests)

      const visitorsTableRows = buildVisitorsTableRows({ visitors, t: req.t, lng: req.language as Locale })

      const hideLinkVisitors =
        config.features.confirmPrisonerLocation &&
        prisoner.prisonId !== prisoner.registeredPrisonId &&
        prisoner.prisonId !== undefined &&
        prisoner.prisonId !== null &&
        config.noDigitalServicePrisonIds.includes(prisoner.prisonId)

      return res.render('pages/visitors/visitors', {
        prisoner: booker.prisoners[0],
        visitorsTableRows,
        visitorRequestsTableRows,
        bookerWithdrawEnabled: config.features.bookerWithdrawEnabled,
        hideLinkVisitors,
        showOLServiceNav: true,
      })
    }
  }

  private buildVisitorRequestsTableRows(
    req: Request,
    visitorRequests: BookerPrisonerVisitorRequestDetail[],
  ): GOVUKTableRow[] {
    if (config.features.bookerWithdrawEnabled) {
      req.session.pendingVisitors = visitorRequests

      return buildVisitorRequestsTableRowsWithCancellationLink({
        visitors: visitorRequests,
        t: req.t,
        lng: req.language as Locale,
      })
    }

    return buildVisitorRequestsTableRows({ visitors: visitorRequests, lng: req.language as Locale })
  }
}
