import type { RequestHandler } from 'express'
import { VisitSessionsService } from '../../services'

export default class SelectVisitDateTimeController {
  public constructor(private readonly visitSessionsService: VisitSessionsService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { prison, prisoner, selectedVisitors } = req.session.bookingJourney

      const selectedVisitorIds = selectedVisitors.map(visitor => visitor.visitorId)

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
      // const { visitSession } = req.body
      // TODO validate visit session selection and save to req.session
      // logger.info('Selected visit session: ', visitSession)

      return res.redirect('/book-a-visit/select-additional-support')
    }
  }
}
