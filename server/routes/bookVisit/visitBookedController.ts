import type { RequestHandler } from 'express'

export default class VisitBookedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { bookingConfirmed } = req.session

      let prisonPhoneNumber = ''
      let prisonWebsite = ''
      if (bookingConfirmed.prisonCode === 'FHI') {
        prisonPhoneNumber = '01234567890'
        prisonWebsite = 'https://www.gov.uk/guidance/foston-hall-prison'
      } else if (bookingConfirmed.prisonCode === 'DHI') {
        prisonPhoneNumber = '09876543210'
        prisonWebsite = 'https://www.gov.uk/guidance/drake-hall-prison'
      }

      const supportedPrison = bookingConfirmed.prisonCode === 'DHI' || bookingConfirmed.prisonCode === 'FHI'
      res.render('pages/bookVisit/visitBooked', {
        bookingConfirmed,
        prisonPhoneNumber,
        prisonWebsite,
        supportedPrison,
      })
    }
  }
}
