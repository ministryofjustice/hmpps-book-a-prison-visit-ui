import type { RequestHandler } from 'express'
import { VisitSessionsService } from '../../services'

export default class SelectVisitDateTimeController {
  public constructor(private readonly visitSessionsService: VisitSessionsService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { prison, prisoner, selectedVisitors } = req.session.bookingJourney

      const selectedVisitorIds = selectedVisitors.map(visitor => visitor.personId)

      const { calendar, firstSessionDate } = await this.visitSessionsService.getVisitSessionsCalendar(
        prisoner.prisonCode,
        prisoner.prisonerNumber,
        selectedVisitorIds,
        prison.policyNoticeDaysMax,
      )

      res.render('pages/bookingJourney/selectVisitDateTime', {
        calendar,
        selectedDate: firstSessionDate,
        prisoner,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const { visitSession } = req.body

      const sessionDate = visitSession.split('_')[0]
      const sessionTemplateReference = visitSession.split('_')[1]

      return res.send(
        `<pre>Visit session selected:\n\nsessionDate: ${sessionDate}\n\nsessionTemplateReference: ${sessionTemplateReference}</pre>`,
      )
    }
  }
}
