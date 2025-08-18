import type { RequestHandler } from 'express'
import { SessionData } from 'express-session'
import createError from 'http-errors'
import { VisitService } from '../../services'
import { VisitDetails } from '../../services/visitService'

export default class BookingsController {
  public constructor(private readonly visitService: VisitService) {}

  public view(type: SessionData['bookings']['type']): RequestHandler {
    return async (req, res, next) => {
      const { booker } = req.session

      let visits: VisitDetails[]
      switch (type) {
        case 'future':
          visits = await this.visitService.getFuturePublicVisits(booker.reference)
          break

        case 'past':
          visits = await this.visitService.getPastPublicVisits(booker.reference)
          break

        case 'cancelled':
          visits = await this.visitService.getCancelledPublicVisits(booker.reference)
          break

        default:
          return next(createError(500, `Invalid bookings type: ${type}`))
      }

      req.session.bookings = { type, visits }
      console.log(visits)

      return res.render(`pages/bookings/${type}`, { visits, showOLServiceNav: true })
    }
  }
}
