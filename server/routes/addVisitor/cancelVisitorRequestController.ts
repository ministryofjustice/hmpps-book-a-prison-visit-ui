import type { RequestHandler } from 'express'
import { ValidationChain, matchedData, body, validationResult } from 'express-validator'
import { type UUID } from 'crypto'
import { BookerService } from '../../services'
import paths from '../../constants/paths'
import { SessionData } from 'express-session'
import { BookerPrisonerVisitorRequestDetail } from '../../services/bookerService'
import { validatePendingVisitorDisplayId, validateVisitDisplayId } from '../visits/validations'

export default class CancelVisitorRequestController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { pendingVisitors } = req.session as SessionData
      console.log(req)
      // console.log(req.session)
      console.log("typeof pendingVisitors: " + typeof pendingVisitors)
      console.log(pendingVisitors)

      const errors = validationResult(req)
      if (!errors.isEmpty() || pendingVisitors == undefined) {
        return res.redirect(paths.VISITS.HOME)
      }

      const { visitorDisplayId } = matchedData<{ visitorDisplayId: UUID }>(req)

      console.log(visitorDisplayId)

      const visitor: BookerPrisonerVisitorRequestDetail = pendingVisitors.find(
        v => v.visitorDisplayId === visitorDisplayId,
      )!

      console.log(visitor)

      return res.render('pages/addVisitor/cancel/cancel', {
        errors: req.flash('errors'),
        visitor,
        visitorDisplayId,
        showOLServiceNav: true,
      })
    }
  }

  public submit(): RequestHandler {
     return async (req, res, next) => {
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
      const visitor = pendingVisitors?.find(v => v.visitorDisplayId === visitorDisplayId)!

       await this.bookerService.withdrawVisitorRequest({
        bookerReference: booker!.reference,
        visitorReference: visitor.reference
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
        .withMessage((_value, { req }) => req.t('validation:noAnswerSelected'))
    ]
  }
}
