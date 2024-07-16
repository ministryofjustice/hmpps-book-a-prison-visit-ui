import type { RequestHandler } from 'express'
import { BookerService, VisitService } from '../../services'
import getPrisonInformation from '../../constants/prisonInformation'

export default class BookingsController {
  public constructor(
    private readonly visitService: VisitService,
    private readonly bookerService: BookerService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { booker } = req.session

      const visits = await this.visitService.getFuturePublicVisits(booker.reference)
      req.session.bookings = visits

      const { prisonName, prisonPhoneNumber } = getPrisonInformation(visits[0]?.prisonId)

      res.render('pages/bookings/index', { visits, prisonName, prisonPhoneNumber, showServiceNav: true })
    }
  }
}
