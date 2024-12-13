import type { RequestHandler } from 'express'
import { Meta, ValidationChain, matchedData, param, validationResult } from 'express-validator'
import { SessionData } from 'express-session'
import { PrisonService } from '../../services'
import paths from '../../constants/paths'

export default class BookingDetailsController {
  public constructor(private readonly prisonService: PrisonService) {}

  public view(type: SessionData['bookings']['type']): RequestHandler {
    return async (req, res) => {
      const { bookings } = req.session

      const errors = validationResult(req)
      if (!errors.isEmpty() || bookings.type !== type) {
        return res.redirect(paths.BOOKINGS.HOME)
      }

      const { visitDisplayId } = matchedData<{ visitDisplayId: string }>(req)

      const { visits } = bookings
      const visit = visits.find(v => v.visitDisplayId === visitDisplayId)

      const prison = await this.prisonService.getPrison(visit.prisonId)

      const nowTimestamp = new Date()
      const visitStartTimestamp = new Date(visit.startTimestamp)
      const showCancel = nowTimestamp < visitStartTimestamp && visit.visitStatus !== 'CANCELLED'

      const backLinkHref =
        (type === 'past' && paths.BOOKINGS.PAST) ||
        (type === 'cancelled' && paths.BOOKINGS.CANCELLED) ||
        paths.BOOKINGS.HOME

      return res.render('pages/bookings/visit', {
        backLinkHref,
        prison,
        type,
        visit,
        showCancel,
        showServiceNav: true,
      })
    }
  }

  public validate(): ValidationChain[] {
    return [
      param('visitDisplayId')
        .isUUID()
        .bail()
        .custom((visitDisplayId: string, { req }: Meta & { req: Express.Request }) => {
          const { bookings } = req.session
          const visits = bookings?.visits ?? []

          return visits.some(visit => visit.visitDisplayId === visitDisplayId)
        }),
    ]
  }
}
