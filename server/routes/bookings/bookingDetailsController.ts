import type { RequestHandler } from 'express'
import { Meta, ValidationChain, matchedData, param, validationResult } from 'express-validator'
import { SessionData } from 'express-session'
import { BookerService, PrisonService } from '../../services'
import paths from '../../constants/paths'

export default class BookingDetailsController {
  public constructor(
    private readonly bookerService: BookerService,
    private readonly prisonService: PrisonService,
  ) {}

  public view(type: SessionData['bookings']['type']): RequestHandler {
    return async (req, res) => {
      const { booker, bookings } = req.session
      const prisoner = booker.prisoners[0]

      const errors = validationResult(req)
      if (!errors.isEmpty() || bookings.type !== type) {
        return res.redirect(paths.BOOKINGS.HOME)
      }

      const showTransferOrReleaseBanner =
        type === 'future' &&
        prisoner &&
        (await this.bookerService.isPrisonerTransferredOrReleased(booker.reference, prisoner.prisonerNumber))

      const { visitDisplayId } = matchedData<{ visitDisplayId: string }>(req)
      const { visits } = bookings
      const visit = visits.find(v => v.visitDisplayId === visitDisplayId)

      const prison = await this.prisonService.getPrison(visit.prisonId)

      const nowTimestamp = new Date()
      const visitStartTimestamp = new Date(visit.startTimestamp)
      const showCancelButton = nowTimestamp < visitStartTimestamp && visit.visitStatus !== 'CANCELLED'

      const backLinkHref =
        (type === 'past' && paths.BOOKINGS.PAST) ||
        (type === 'cancelled' && paths.BOOKINGS.CANCELLED) ||
        paths.BOOKINGS.HOME

      return res.render('pages/bookings/visit', {
        backLinkHref,
        prison,
        prisoner,
        type,
        visit,
        showTransferOrReleaseBanner,
        showCancelButton,
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
