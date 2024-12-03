import type { RequestHandler } from 'express'
import { Meta, ValidationChain, matchedData, param, body, validationResult } from 'express-validator'
import { VisitService } from '../../../services'
import paths from '../../../constants/paths'
import { isMobilePhoneNumber } from '../../../utils/utils'

export default class CancelController {
  public constructor(private readonly visitService: VisitService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { booker, bookings } = req.session

      const errors = validationResult(req)
      if (!errors.isEmpty() || bookings.type !== 'future') {
        return res.redirect(paths.BOOKINGS.HOME)
      }

      const { visitDisplayId } = matchedData<{ visitDisplayId: string }>(req)

      const { visits } = bookings
      const visit = visits.find(v => v.visitDisplayId === visitDisplayId)

      const prisoner = {
        firstName: visit.prisonerFirstName,
        lastName: visit.prisonerLastName,
      }

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
      const { cancelBooking, visitDisplayId } = matchedData<{
        cancelBooking: 'yes' | 'no'
        visitDisplayId: string
      }>(req)

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

      const { booker, bookings } = req.session
      const { visits } = bookings
      const visit = visits.find(v => v.visitDisplayId === visitDisplayId)

      await this.visitService.cancelVisit({
        applicationReference: visit.reference,
        actionedBy: booker.reference,
      })

      req.session.bookingCancelled = {
        hasEmail: !!visit.visitContact.email,
        hasMobile: isMobilePhoneNumber(visit.visitContact.telephone),
      }

      return res.redirect(paths.BOOKINGS.CANCEL_CONFIRMATION)
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
