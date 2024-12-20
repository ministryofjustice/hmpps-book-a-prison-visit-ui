import type { RequestHandler } from 'express'
import { BookingConfirmed } from '../../@types/bapv'
import { VisitService } from '../../services'
import paths from '../../constants/paths'
import { ApplicationValidationErrorResponse } from '../../data/orchestrationApiTypes'
import { SanitisedError } from '../../sanitisedError'
import { getMainContactName, isMobilePhoneNumber } from '../../utils/utils'

export default class CheckVisitDetailsController {
  public constructor(private readonly visitService: VisitService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { bookingJourney } = req.session

      res.render('pages/bookVisit/checkVisitDetails', {
        additionalSupport: bookingJourney.visitorSupport,
        mainContactName: getMainContactName(bookingJourney.mainContact),
        mainContactPhone: bookingJourney.mainContactPhone,
        mainContactEmail: bookingJourney.mainContactEmail,
        sessionDate: bookingJourney.selectedVisitSession.sessionDate,
        sessionTimeSlot: bookingJourney.selectedVisitSession.sessionTimeSlot,
        visitors: bookingJourney.selectedVisitors,
        prisoner: bookingJourney.prisoner,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res, next) => {
      const { bookingJourney, booker } = req.session

      try {
        const visit = await this.visitService.bookVisit({
          applicationReference: bookingJourney.applicationReference,
          actionedBy: booker.reference,
        })

        const bookingConfirmed: BookingConfirmed = {
          prison: bookingJourney.prison,
          visitReference: visit.reference,
          hasEmail: !!bookingJourney.mainContactEmail,
          hasMobile: isMobilePhoneNumber(bookingJourney.mainContactPhone),
        }
        req.session.bookingConfirmed = bookingConfirmed

        delete req.session.bookingJourney
        return res.redirect(paths.BOOK_VISIT.BOOKED)
      } catch (error) {
        if (error.status === 422) {
          const validationErrors =
            (error as SanitisedError<ApplicationValidationErrorResponse>)?.data?.validationErrors ?? []

          if (validationErrors.includes('APPLICATION_INVALID_PRISONER_NOT_FOUND')) {
            return next(error)
          }

          if (validationErrors.includes('APPLICATION_INVALID_PRISON_PRISONER_MISMATCH')) {
            bookingJourney.cannotBookReason = 'TRANSFER_OR_RELEASE'
            return res.redirect(paths.BOOK_VISIT.CANNOT_BOOK)
          }

          if (validationErrors.includes('APPLICATION_INVALID_NO_VO_BALANCE')) {
            bookingJourney.cannotBookReason = 'NO_VO_BALANCE'
            return res.redirect(paths.BOOK_VISIT.CANNOT_BOOK)
          }

          req.flash('message', 'Your visit time is no longer available. Select a new time.')
          delete bookingJourney.selectedVisitSession
          return res.redirect(paths.BOOK_VISIT.CHOOSE_TIME)
        }

        return next(error)
      }
    }
  }
}
