import type { RequestHandler } from 'express'
import { BookingConfirmed } from '../../@types/bapv'
import { VisitService } from '../../services'
import paths from '../../constants/paths'
import { ApplicationValidationErrorResponse } from '../../data/orchestrationApiTypes'
import { SanitisedError } from '../../sanitisedError'

export default class CheckVisitDetailsController {
  public constructor(private readonly visitService: VisitService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { bookingJourney } = req.session
      const mainContactName =
        typeof bookingJourney.mainContact.contact === 'string'
          ? bookingJourney.mainContact.contact
          : `${bookingJourney.mainContact.contact.firstName} ${bookingJourney.mainContact.contact.lastName}`

      res.render('pages/bookVisit/checkVisitDetails', {
        additionalSupport: bookingJourney.visitorSupport,
        mainContactName,
        mainContactNumber: bookingJourney.mainContact.phoneNumber,
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
          prisonCode: bookingJourney.prison.code,
          prisonName: bookingJourney.prison.prisonName,
          visitReference: visit.reference,
          hasPhoneNumber: !!bookingJourney.mainContact.phoneNumber,
        }
        req.session.bookingConfirmed = bookingConfirmed

        delete req.session.bookingJourney
        return res.redirect(paths.BOOK_VISIT.BOOKED)
      } catch (error) {
        if (error.status === 422) {
          const validationErrors =
            (error as SanitisedError<ApplicationValidationErrorResponse>)?.data?.validationErrors ?? []

          if (
            validationErrors.includes('APPLICATION_INVALID_PRISONER_NOT_FOUND') ||
            validationErrors.includes('APPLICATION_INVALID_PRISON_PRISONER_MISMATCH')
          ) {
            return next(error)
          }

          if (validationErrors.includes('APPLICATION_INVALID_NO_VO_BALANCE')) {
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
