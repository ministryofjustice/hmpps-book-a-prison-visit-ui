import type { RequestHandler } from 'express'
import { BookerService } from '../../services'
import paths from '../../constants/paths'
import { buildVisitorRequestsTableRows, buildVisitorsTableRows } from './visitorsUtils'
import type { Locale } from '../../constants/locales'

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

      const visitorsTableRows = buildVisitorsTableRows({ visitors, t: req.t, lng: req.language as Locale })
      const visitorRequestsTableRows = buildVisitorRequestsTableRows({
        visitors: visitorRequests,
        lng: req.language as Locale,
      })

      return res.render('pages/visitors/visitors', {
        prisoner: booker.prisoners[0],
        visitorsTableRows,
        visitorRequestsTableRows,
        showOLServiceNav: true,
      })
    }
  }
}
