import type { RequestHandler } from 'express'
import { Meta, ValidationChain, body, matchedData, validationResult } from 'express-validator'
import { VisitService, VisitSessionsService } from '../../services'
import paths from '../../constants/paths'

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

      const { calendar, firstSessionDate, allVisitSessionIds, allVisitSessions } =
        await this.visitSessionsService.getVisitSessionsCalendar({
          prisonId: prisoner.prisonId,
          prisonerId: prisoner.prisonerNumber,
          visitorIds: selectedVisitorIds,
          excludedApplicationReference: applicationReference,
          daysAhead: prison.policyNoticeDaysMax,
        })

      if (allVisitSessionIds.length === 0) {
        return res.render('pages/bookVisit/chooseVisitTimeNoSessions')
      }

      bookingJourney.allVisitSessionIds = allVisitSessionIds
      bookingJourney.allVisitSessions = allVisitSessions

      const { selectedVisitSession } = bookingJourney

      const formValues = selectedVisitSession
        ? { visitSession: `${selectedVisitSession.sessionDate}_${selectedVisitSession.sessionTemplateReference}` }
        : {}

      return res.render('pages/bookVisit/chooseVisitTime', {
        errors: req.flash('errors'),
        formValues,
        message: req.flash('message')?.[0],
        calendar,
        selectedDate: selectedVisitSession?.sessionDate ?? firstSessionDate,
        prisoner,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res, next) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect(paths.BOOK_VISIT.CHOOSE_TIME)
      }
      const { visitSession } = matchedData<{ visitSession: string }>(req)
      const visitSessionSplit = visitSession.split('_')
      const selectedSessionDate = visitSessionSplit[0]
      const selectedSessionTemplateReference = visitSessionSplit[1]

      const { booker, bookingJourney } = req.session

      const selectedVisitSession = bookingJourney.allVisitSessions.find(
        session =>
          session.sessionTemplateReference === selectedSessionTemplateReference &&
          session.sessionDate === selectedSessionDate,
      )

      bookingJourney.selectedVisitSession = selectedVisitSession

      try {
        // first time through: create an application
        if (bookingJourney.applicationReference === undefined) {
          const application = await this.visitService.createVisitApplication({
            bookingJourney,
            bookerReference: booker.reference,
          })

          bookingJourney.applicationReference = application.reference
        } else {
          // existing application so update it
          await this.visitService.changeVisitApplication({ bookingJourney })
        }
      } catch (error) {
        // HTTP 400 Bad Request is the response when a session is no longer available
        if (error.status === 400) {
          req.flash('message', 'Your visit time is no longer available. Select a new time.')
          delete bookingJourney.selectedVisitSession
          return res.redirect(paths.BOOK_VISIT.CHOOSE_TIME)
        }
        return next(error)
      }

      return res.redirect(paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
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
