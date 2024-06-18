import type { RequestHandler } from 'express'
import { BookingConfirmed } from '../../@types/bapv'
import { VisitService } from '../../services'
import paths from '../../constants/paths'

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
        visitSlot: bookingJourney.selectedVisitSession.sessionDate,
        visitTimeslot: bookingJourney.selectedVisitSession.sessionTimeSlot,
        visitors: bookingJourney.selectedVisitors,
        prisoner: bookingJourney.prisoner,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res, next) => {
      const { bookingJourney } = req.session

      try {
        const visit = await this.visitService.bookVisit({ applicationReference: bookingJourney.applicationReference })

        const bookingConfirmed: BookingConfirmed = {
          prisonCode: bookingJourney.prison.code,
          prisonName: bookingJourney.prison.prisonName,
          visitReference: visit.reference,
        }
        req.session.bookingConfirmed = bookingConfirmed

        delete req.session.bookingJourney
        return res.redirect(paths.BOOK_VISIT.BOOKED)
      } catch (error) {
        // TODO handle errors (VB-3597)
        return next(error)
      }
    }
  }
}
