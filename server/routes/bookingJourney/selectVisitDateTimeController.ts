import type { RequestHandler } from 'express'
import { VisitSessionsService } from '../../services'

export default class SelectVisitDateTimeController {
  public constructor(private readonly visitSessionsService: VisitSessionsService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { prison, prisoner, selectedVisitors } = req.session.bookingJourney

      const selectedVisitorIds = selectedVisitors.map(visitor => visitor.personId)

      const visitSessionsCalendar = await this.visitSessionsService.getVisitSessionsCalendar(
        prisoner.prisonCode,
        prisoner.prisonerNumber,
        selectedVisitorIds,
        prison.policyNoticeDaysMax,
      )

      res.render('pages/bookingJourney/selectVisitDateTime', {
        booker: req.session.booker,
        bookingJourney: req.session.bookingJourney,
        visitSessionsCalendar,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const { visitSlot } = req.body

      const sessionDate = visitSlot.split('_')[0]
      const sessionTemplateReference = visitSlot.split('_')[1]

      return res.send(
        `<pre>Visit slot selected:\n\nsessionDate: ${sessionDate}\n\nsessionTemplateReference: ${sessionTemplateReference}</pre>`,
      )
    }
  }
}
