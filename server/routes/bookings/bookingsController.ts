import type { RequestHandler } from 'express'
import { SessionData } from 'express-session'
import createError from 'http-errors'
import { PrisonService, VisitService } from '../../services'
import { VisitDetails } from '../../services/visitService'
import { PrisonDto } from '../../data/orchestrationApiTypes'

export default class BookingsController {
  public constructor(
    private readonly prisonService: PrisonService,
    private readonly visitService: VisitService,
  ) {}

  public view(type: SessionData['bookings']['type']): RequestHandler {
    return async (req, res, next) => {
      const { booker } = req.session

      let visits: VisitDetails[]
      let prison: PrisonDto
      switch (type) {
        case 'future':
          visits = await this.visitService.getFuturePublicVisits(booker.reference)
          // making assumption here that all visits[] will be for the same prison
          prison = visits.length ? await this.prisonService.getPrison(visits[0].prisonId) : undefined

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

      return res.render(`pages/bookings/${type}`, { prison, visits, showServiceNav: true })
    }
  }
}
