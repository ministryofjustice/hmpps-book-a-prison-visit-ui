import type { RequestHandler } from 'express'
import getPrisonInformation from '../../constants/prisonInformation'

export default class VisitBookedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { bookingConfirmed } = req.session

      const { prisonPhoneNumber, prisonWebsite } = getPrisonInformation(bookingConfirmed.prisonCode)

      const supportedPrison = bookingConfirmed.prisonCode === 'DHI' || bookingConfirmed.prisonCode === 'FHI'
      res.render('pages/bookVisit/visitBooked', {
        bookingConfirmed,
        prisonPhoneNumber,
        prisonWebsite,
        supportedPrison,
        showServiceNav: true,
      })
    }
  }
}
