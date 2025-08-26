import type { RequestHandler } from 'express'
import { Meta, ValidationChain, body, matchedData, validationResult } from 'express-validator'
import { VisitService, VisitSessionsService } from '../../services'
import paths from '../../constants/paths'
import { AvailableVisitSessionDto } from '../../data/orchestrationApiTypes'
import { MoJAlert } from '../../@types/bapv'
import { Visitor } from '../../services/bookerService'

export default class ChooseVisitTimeController {
  public constructor(
    private readonly visitService: VisitService,
    private readonly visitSessionsService: VisitSessionsService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { bookingJourney, booker } = req.session
      const { prisoner, prison, selectedVisitors, applicationReference } = bookingJourney

      const selectedVisitorIds = selectedVisitors.map(visitor => visitor.visitorId)
      const bannedVisitors = this.getVisitorsWithFurthestBanExpiry(selectedVisitors)

      const { calendar, firstSessionDate, allVisitSessionIds, allVisitSessions } =
        await this.visitSessionsService.getVisitSessionsCalendar({
          prisonId: prisoner.prisonId,
          prisonerId: prisoner.prisonerNumber,
          visitorIds: selectedVisitorIds,
          bookerReference: booker.reference,
          excludedApplicationReference: applicationReference,
          daysAhead: prison.policyNoticeDaysMax,
        })

      if (allVisitSessionIds.length === 0) {
        return res.render('pages/bookVisit/chooseVisitTimeNoSessions')
      }

      bookingJourney.allVisitSessionIds = allVisitSessionIds
      bookingJourney.allVisitSessions = allVisitSessions

      const { selectedVisitSession } = bookingJourney
      const isSelectedSessionStillAvailable = this.isSelectedSessionStillAvailable({
        selectedVisitSession,
        allVisitSessions,
      })

      const messages: MoJAlert[] = req.flash('messages') ?? []

      if (selectedVisitSession && !isSelectedSessionStillAvailable) {
        messages.push({
          variant: 'error',
          title: 'Your visit time is no longer available.',
          showTitleAsHeading: true,
          text: 'Select a new time',
        })
      }

      const formValues = isSelectedSessionStillAvailable
        ? { visitSession: `${selectedVisitSession.sessionDate}_${selectedVisitSession.sessionTemplateReference}` }
        : {}

      const selectedDate = isSelectedSessionStillAvailable ? selectedVisitSession.sessionDate : firstSessionDate

      const backLinkHref =
        bookingJourney.sessionRestriction === 'OPEN' ? paths.BOOK_VISIT.SELECT_VISITORS : paths.BOOK_VISIT.CLOSED_VISIT

      return res.render('pages/bookVisit/chooseVisitTime', {
        errors: req.flash('errors'),
        formValues,
        messages,
        calendar,
        selectedDate,
        prisoner,
        bannedVisitors,
        backLinkHref,
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
          req.flash('messages', {
            variant: 'error',
            title: 'Your visit time is no longer available',
            showTitleAsHeading: true,
            text: 'Select a new time.',
          })

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

  private isSelectedSessionStillAvailable({
    selectedVisitSession,
    allVisitSessions,
  }: {
    selectedVisitSession: AvailableVisitSessionDto
    allVisitSessions: AvailableVisitSessionDto[]
  }): boolean {
    if (!selectedVisitSession) {
      return false
    }
    return allVisitSessions.some(
      session =>
        session.sessionDate === selectedVisitSession.sessionDate &&
        session.sessionTemplateReference === selectedVisitSession.sessionTemplateReference &&
        session.sessionRestriction === selectedVisitSession.sessionRestriction,
    )
  }

  private getVisitorsWithFurthestBanExpiry(visitors: Visitor[]): Visitor[] {
    return (
      visitors
        // banned visitors
        .filter(visitor => visitor.banned)
        // sort by descending ban expiry date
        .sort((a, b) => b.banExpiryDate.localeCompare(a.banExpiryDate))
        // filter to just visitor(s) with the furthest expiry date
        .filter(
          (visitor, _index, visitorsSortedByBanExpiry) =>
            visitor.banExpiryDate === visitorsSortedByBanExpiry[0].banExpiryDate,
        )
    )
  }
}
