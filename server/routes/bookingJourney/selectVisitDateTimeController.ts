import type { RequestHandler } from 'express'
import { ValidationChain, body, validationResult } from 'express-validator'
import { VisitSessionsService } from '../../services'

export default class SelectVisitDateTimeController {
  public constructor(private readonly visitSessionsService: VisitSessionsService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { prison, prisoner, selectedVisitors } = req.session.bookingJourney

      const selectedVisitorIds = selectedVisitors.map(visitor => visitor.visitorId)

      const { calendar, firstSessionDate, allVisitSessionIds } =
        await this.visitSessionsService.getVisitSessionsCalendar(
          prisoner.prisonCode,
          prisoner.prisonerNumber,
          selectedVisitorIds,
          prison.policyNoticeDaysMax,
        )

      req.session.bookingJourney.allVisitSessionIds = allVisitSessionIds

      // TODO if availableVisitSessions.length === 0 then render a different page: 'No slots available' (VB-3713)

      res.render('pages/bookingJourney/selectVisitDateTime', {
        errors: req.flash('errors'),
        formValues: req.flash('formValues')?.[0] || {},
        calendar,
        selectedDate: firstSessionDate,
        prisoner,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        req.flash('formValues', req.body)
        return res.redirect('/book-a-visit/select-date-and-time')
      }

      // const { visitSession } = req.body
      // TODO validate visit session selection and save to req.session
      // logger.info('Selected visit session: ', visitSession)

      return res.redirect('/book-a-visit/select-additional-support')
    }
  }

  public validate(): ValidationChain[] {
    return [body('visitSession').notEmpty().withMessage('No visit time selected')]
  }
}
