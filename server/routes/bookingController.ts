import type { RequestHandler } from 'express'
import { VisitService } from '../services'

export default class BookingController {
  public constructor(private readonly visitService: VisitService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { booker } = req.session

      const visits = await this.visitService.getFuturePublicVisit(booker.reference)
      const { prisonCode } = booker.prisoners[0]
      let prisonName = ''
      let prisonPhoneNumber = ''
      if (prisonCode === 'DHI') {
        prisonName = 'Drake Hall (HMP)'
        prisonPhoneNumber = '09876543210'
      } else if (prisonCode === 'FHI') {
        prisonName = 'Foston Hall (HMP)'
        prisonPhoneNumber = '01234567890'
      }

      res.render('pages/booking', { visits, prisonName, prisonPhoneNumber, showServiceNav: true })
    }
  }
}
