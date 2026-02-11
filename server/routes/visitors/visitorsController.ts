import type { RequestHandler } from 'express'
import { BookerService } from '../../services'
import paths from '../../constants/paths'
import { buildVisitorRequestsTableRows, buildVisitorsTableRows } from './visitorsUtils'

export default class VisitorsController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { booker } = req.session

      if (!booker.prisoners?.length) {
        return res.redirect(paths.HOME)
      }

      const prisoner = booker.prisoners[0]

      const [visitors, visitorRequests] = await Promise.all([
        this.bookerService.getVisitors(booker.reference, prisoner.prisonerNumber),
        this.bookerService.getVisitorRequests({
          bookerReference: booker.reference,
          prisonerNumber: prisoner.prisonerNumber,
        }),
      ])

      const visitorsTableRows = buildVisitorsTableRows(visitors)
      const visitorRequestsTableRows = buildVisitorRequestsTableRows(visitorRequests)

      return res.render('pages/visitors/visitors', {
        prisoner: booker.prisoners[0],
        visitorsTableRows,
        visitorRequestsTableRows,
        showOLServiceNav: true,
      })
    }
  }
}
