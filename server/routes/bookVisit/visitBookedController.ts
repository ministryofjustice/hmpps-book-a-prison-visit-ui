import type { RequestHandler } from 'express'

export default class VisitBookedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { bookingConfirmed } = req.session

      const prisonPhoneNumber = bookingConfirmed.prisonCode === 'FHI' ? '01234567890' : '09876543210'
      const prisonWebsite =
        bookingConfirmed.prisonCode === 'FHI'
          ? 'https://www.gov.uk/guidance/foston-hall-prison'
          : 'https://www.gov.uk/guidance/drake-hall-prison'

      const supportedPrison = bookingConfirmed.prisonCode === 'DHI' || bookingConfirmed.prisonCode === 'FHI'
      res.render('pages/bookVisit/visitBooked', {
        bookingConfirmed,
        visitReference: bookingConfirmed.visitReference,
        prisonName: bookingConfirmed.prisonName,
        hasPhoneNumber: bookingConfirmed.hasPhoneNumber,
        prisonPhoneNumber,
        prisonWebsite,
        supportedPrison,
      })
    }
  }
}
