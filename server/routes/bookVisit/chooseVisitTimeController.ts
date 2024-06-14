import type { RequestHandler } from 'express'
import { Meta, ValidationChain, body, validationResult } from 'express-validator'
import { VisitService, VisitSessionsService } from '../../services'

export default class ChooseVisitTimeController {
  public constructor(
    private readonly visitService: VisitService,
    private readonly visitSessionsService: VisitSessionsService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { bookingJourney } = req.session
      const { prisoner, prison, selectedVisitors, applicationReference } = bookingJourney

      const selectedVisitorIds = selectedVisitors.map(visitor => visitor.visitorId)

      const { calendar, firstSessionDate, allVisitSessionIds, sessionRestriction } =
        await this.visitSessionsService.getVisitSessionsCalendar({
          prisonId: prisoner.prisonCode,
          prisonerId: prisoner.prisonerNumber,
          visitorIds: selectedVisitorIds,
          ...(applicationReference && { excludedApplicationReference: applicationReference }),
          daysAhead: prison.policyNoticeDaysMax,
        })

      if (allVisitSessionIds.length === 0) {
        return res.render('pages/bookVisit/chooseVisitTimeNoSessions')
      }

      bookingJourney.allVisitSessionIds = allVisitSessionIds
      bookingJourney.sessionRestriction = sessionRestriction

      return res.render('pages/bookVisit/chooseVisitTime', {
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
        return res.redirect('/book-visit/choose-visit-time')
      }

      const visitSession = req.body.visitSession.split('_')
      const selectedSessionDate = visitSession[0]
      const selectedSessionTemplateReference = visitSession[1]

      const { booker, bookingJourney } = req.session
      bookingJourney.selectedSessionDate = selectedSessionDate
      bookingJourney.selectedSessionTemplateReference = selectedSessionTemplateReference

      try {
        const application = await this.visitService.createVisitApplication({
          bookingJourney,
          bookerReference: booker.reference,
        })

        bookingJourney.applicationReference = application.reference
      } catch (error) {
        // TODO catch create application errors - VB-3777
        return res.redirect('/book-visit/choose-visit-time')
      }

      return res.redirect('/book-visit/additional-support')
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('visitSession')
        .customSanitizer((visitSession: string, { req }: Meta & { req: Express.Request }) => {
          const { allVisitSessionIds } = req.session.bookingJourney
          return allVisitSessionIds.includes(visitSession) ? visitSession : undefined
        })
        .notEmpty()
        .withMessage('No visit time selected'),
    ]
  }
}
