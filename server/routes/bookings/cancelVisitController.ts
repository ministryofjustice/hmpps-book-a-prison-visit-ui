import type { RequestHandler } from 'express'
import { Meta, ValidationChain, matchedData, param, body, validationResult } from 'express-validator'
import { BookerService, VisitService } from '../../services'
import paths from '../../constants/paths'

export default class CancelVisitController {
  public constructor(
    private readonly bookerService: BookerService,
    private readonly visitService: VisitService,
  ) {}

  public confirmCancelView(): RequestHandler {
    return async (req, res) => {
      const { booker, bookings } = req.session
      const { visits } = bookings

      const errors = validationResult(req)
      if (!errors.isEmpty() || bookings.type !== 'future') {
        return res.redirect(paths.BOOKINGS.HOME)
      }

      const prisoner = booker.prisoners?.[0]
        ? booker.prisoners?.[0]
        : (await this.bookerService.getPrisoners(booker.reference))?.[0]

      const { visitDisplayId } = matchedData<{ visitDisplayId: string }>(req)

      const visit = visits.find(v => v.visitDisplayId === visitDisplayId)

      return res.render('pages/bookings/cancel/cancel', {
        errors: req.flash('errors'),
        booker,
        prisoner,
        visit,
        visitDisplayId,
        showServiceNav: true,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res, next) => {
      const { booker, bookings } = req.session
      const { visits } = bookings
      const { cancelBooking } = req.body

      const { visitDisplayId } = matchedData<{ visitDisplayId: string }>(req)

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())

        if (!visitDisplayId) {
          return res.redirect(paths.BOOKINGS.HOME)
        }

        return res.redirect(`${paths.BOOKINGS.CANCEL_VISIT}/${visitDisplayId}`)
      }

      if (cancelBooking === 'no') {
        return res.redirect(`${paths.BOOKINGS.VISIT}/${visitDisplayId}`)
      }

      const visit = visits.find(v => v.visitDisplayId === visitDisplayId)

      await this.visitService.cancelVisit({
        applicationReference: visit.reference,
        actionedBy: booker.reference,
      })

      return res.redirect(paths.BOOKINGS.CANCEL_CONFIRMATION)
    }
  }

  public visitCancelled(): RequestHandler {
    return async (req, res) => {
      return res.render('pages/bookings/cancel/cancelConfirmation', {
        showServiceNav: true,
      })
    }
  }

  public validateDisplayId(): ValidationChain[] {
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

  public validateCancelChoice(): ValidationChain[] {
    return [
      body('cancelBooking').isIn(['yes', 'no']).withMessage('No answer selected'),
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
