import type { RequestHandler } from 'express'
import { ValidationChain, matchedData, body, validationResult } from 'express-validator'
import { type UUID } from 'crypto'
import { SessionData } from 'express-session'
import { BookerService } from '../../services'
import paths from '../../constants/paths'
import { BookerPrisonerVisitorRequestDetail } from '../../services/bookerService'
import { validatePendingVisitorDisplayId } from '../visits/validations'

export default class CancelVisitorRequestController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { pendingVisitors } = req.session as SessionData
      const errors = validationResult(req)
      if (!errors.isEmpty() || pendingVisitors === undefined) {
        return res.redirect(paths.VISITS.HOME)
      }

      const { visitorDisplayId } = matchedData<{ visitorDisplayId: UUID }>(req)

      const visitor: BookerPrisonerVisitorRequestDetail = pendingVisitors.find(
        pendingVisitor => pendingVisitor.visitorDisplayId === visitorDisplayId,
      )!

      return res.render('pages/addVisitor/cancel/cancel', {
        errors: req.flash('errors'),
        visitor,
        visitorDisplayId,
        showOLServiceNav: true,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const { cancelVisitor, visitorDisplayId } = matchedData<{
        cancelVisitor: 'yes' | 'no'
        visitorDisplayId: UUID
      }>(req)

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())

        if (!visitorDisplayId) {
          return res.redirect(paths.VISITORS)
        }

        return res.redirect(`${paths.ADD_VISITOR.CANCEL}/${visitorDisplayId}`)
      }

      if (cancelVisitor === 'no') {
        return res.redirect(`${paths.VISITORS}`)
      }

      const { booker, pendingVisitors } = req.session
      const visitor = pendingVisitors!.find(pendingVisitor => pendingVisitor.visitorDisplayId === visitorDisplayId)

      await this.bookerService.withdrawVisitorRequest({
        bookerReference: booker!.reference,
        visitorReference: visitor.reference,
      })

      return res.redirect(paths.ADD_VISITOR.CANCEL_CONFIRMATION)
    }
  }

  public validateDisplayId(): ValidationChain[] {
    return [validatePendingVisitorDisplayId]
  }

  public validateCancelChoice(): ValidationChain[] {
    return [
      body('cancelVisitor')
        .isIn(['yes', 'no'])
        .withMessage((_value, { req }) => req.t('validation:noAnswerSelected')),
    ]
  }
}
