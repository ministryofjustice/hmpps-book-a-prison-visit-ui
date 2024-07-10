import type { RequestHandler } from 'express'
import { VisitService } from '../../services'
import getPrisonInformation from '../../constants/prisonInformation'

export default class BookingsController {
  public constructor(private readonly visitService: VisitService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { booker } = req.session

      const visits = await this.visitService.getFuturePublicVisits(booker.reference)

      const { prisonName, prisonPhoneNumber } = getPrisonInformation(booker.prisoners[0].prisonId)

      req.session.bookings = visits
      res.render('pages/bookings/index', { visits, prisonName, prisonPhoneNumber, showServiceNav: true })
    }
  }
}
