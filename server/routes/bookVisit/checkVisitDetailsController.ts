import type { RequestHandler } from 'express'
import { BookVisitConfirmed } from '../../@types/bapv'
import { VisitService } from '../../services'
import paths from '../../constants/paths'
import { ApplicationValidationErrorResponse } from '../../data/orchestrationApiTypes'
import { SanitisedError } from '../../sanitisedError'
import { getMainContactName, isMobilePhoneNumber } from '../../utils/utils'

export default class CheckVisitDetailsController {
  public constructor(private readonly visitService: VisitService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { bookVisitJourney } = req.session

      res.render('pages/bookVisit/checkVisitDetails', {
        additionalSupport: bookVisitJourney.visitorSupport,
        mainContactName: getMainContactName(bookVisitJourney.mainContact),
        mainContactPhone: bookVisitJourney.mainContactPhone,
        mainContactEmail: bookVisitJourney.mainContactEmail,
        sessionDate: bookVisitJourney.selectedVisitSession.sessionDate,
        sessionTimeSlot: bookVisitJourney.selectedVisitSession.sessionTimeSlot,
        visitors: bookVisitJourney.selectedVisitors,
        prisoner: bookVisitJourney.prisoner,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res, next) => {
      const { bookVisitJourney, booker } = req.session

      try {
        const visit = await this.visitService.bookVisit({
          applicationReference: bookVisitJourney.applicationReference,
          actionedBy: booker.reference,
          isRequestBooking: bookVisitJourney.selectedVisitSession.sessionForReview,
          visitors: bookVisitJourney.selectedVisitors,
        })

        const bookVisitConfirmed: BookVisitConfirmed = {
          isARequest: visit.visitSubStatus === 'REQUESTED',
          prison: bookVisitJourney.prison,
          visitReference: visit.reference,
          hasEmail: !!bookVisitJourney.mainContactEmail,
          hasMobile: isMobilePhoneNumber(bookVisitJourney.mainContactPhone),
        }
        req.session.bookVisitConfirmed = bookVisitConfirmed

        delete req.session.bookVisitJourney

        return res.redirect(bookVisitConfirmed.isARequest ? paths.BOOK_VISIT.REQUESTED : paths.BOOK_VISIT.BOOKED)
      } catch (error) {
        if (error.status === 422) {
          const validationErrors =
            (error as SanitisedError<ApplicationValidationErrorResponse>)?.data?.validationErrors ?? []

          if (validationErrors.includes('APPLICATION_INVALID_PRISONER_NOT_FOUND')) {
            return next(error)
          }

          if (validationErrors.includes('APPLICATION_INVALID_PRISON_PRISONER_MISMATCH')) {
            bookVisitJourney.cannotBookReason = 'TRANSFER_OR_RELEASE'
            return res.redirect(paths.BOOK_VISIT.CANNOT_BOOK)
          }

          if (validationErrors.includes('APPLICATION_INVALID_NO_VO_BALANCE')) {
            bookVisitJourney.cannotBookReason = 'NO_VO_BALANCE'
            return res.redirect(paths.BOOK_VISIT.CANNOT_BOOK)
          }

          req.flash('messages', {
            variant: 'error',
            title: 'Your visit time is no longer available.',
            showTitleAsHeading: true,
            text: 'Select a new time',
          })
          delete bookVisitJourney.selectedVisitSession
          return res.redirect(paths.BOOK_VISIT.CHOOSE_TIME)
        }

        return next(error)
      }
    }
  }
}
