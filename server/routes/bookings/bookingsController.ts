import type { RequestHandler } from 'express'
import { VisitService } from '../../services'
import getPrisonInformation from '../../constants/prisonInformation'

export default class BookingsController {
  public constructor(private readonly visitService: VisitService) {}

  public viewFuture(): RequestHandler {
    return async (req, res) => {
      const { booker } = req.session

      const visits = await this.visitService.getFuturePublicVisits(booker.reference)
      req.session.bookingsFuture = visits

      const { prisonName, prisonPhoneNumber } = getPrisonInformation(visits[0]?.prisonId)

      res.render('pages/bookings/future', { visits, prisonName, prisonPhoneNumber, showServiceNav: true })
    }
  }

  public viewPast(): RequestHandler {
    return async (req, res) => {
      const { booker } = req.session

      const visits = await this.visitService.getPastPublicVisits(booker.reference)
      req.session.bookingsPast = visits

      const { prisonName, prisonPhoneNumber } = getPrisonInformation(visits[0]?.prisonId)

      res.render('pages/bookings/past', { visits, prisonName, prisonPhoneNumber, showServiceNav: true })
    }
  }

  public viewCancelled(): RequestHandler {
    return async (req, res) => {
      const { booker } = req.session

      const visits = await this.visitService.getCancelledPublicVisits(booker.reference)
      req.session.bookingsCancelled = visits

      const { prisonName, prisonPhoneNumber } = getPrisonInformation(visits[0]?.prisonId)

      res.render('pages/bookings/cancelled', { visits, prisonName, prisonPhoneNumber, showServiceNav: true })
    }
  }
}
