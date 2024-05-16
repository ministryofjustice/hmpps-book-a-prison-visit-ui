import type { RequestHandler } from 'express'
import { VisitSessionsService } from '../../services'

export default class DateAndTimeController {
  public constructor(private readonly visitSessionsService: VisitSessionsService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { prisoner, selectedVisitors } = req.session.bookingJourney

      const selectedVisitorIds = selectedVisitors.map(visitor => visitor.personId)

      const visitSessions = await this.visitSessionsService.getVisitSessions(
        prisoner.prisonCode,
        prisoner.prisonerNumber,
        selectedVisitorIds,
      )

      res.render('pages/bookingJourney/selectDateAndTime', {
        booker: req.session.booker,
        bookingJourney: req.session.bookingJourney,
        visitSessions,
      })
    }
  }
}
