import type { RequestHandler } from 'express'
import { ValidationChain, matchedData, param, validationResult } from 'express-validator'
import { BookerService, VisitService } from '../../services'
import getPrisonInformation from '../../constants/prisonInformation'
import paths from '../../constants/paths'

export default class BookingDetailsController {
  public constructor(
    private readonly visitService: VisitService,
    private readonly bookerService: BookerService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { booker, bookings } = req.session
      const errors = validationResult(req)
      if (!errors.isEmpty() || !bookings?.length) {
        return res.redirect(paths.BOOKINGS.HOME)
      }

      req.session.bookings = req.session.bookings
        ? req.session.bookings
        : await this.visitService.getFuturePublicVisits(booker.reference)

      const prisoner = booker.prisoners ? booker.prisoners : await this.bookerService.getPrisoners(booker.reference)

      const { visitNumber } = matchedData<{ visitNumber: number }>(req)
      // if manual number entered (larger than current number of visits in session data)
      // redirect to bookings page
      if (visitNumber > bookings.length) {
        return res.redirect(paths.BOOKINGS.HOME)
      }
      const visit = bookings[visitNumber - 1]

      const { prisonName, prisonPhoneNumber, prisonWebsite } = getPrisonInformation(prisoner[0].prisonId)

      return res.render('pages/bookings/visit', {
        visit,
        booker,
        prisoner: prisoner[0],
        prisonName,
        prisonPhoneNumber,
        prisonWebsite,
        showServiceNav: true,
      })
    }
  }

  public validate(): ValidationChain[] {
    return [param('visitNumber').toInt().isInt({ min: 1 })]
  }
}
