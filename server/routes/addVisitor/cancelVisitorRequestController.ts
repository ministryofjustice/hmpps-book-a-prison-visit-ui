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
  //     const { cancelVisit, visitDisplayId } = matchedData<{
  //       cancelVisit: 'yes' | 'no'
  //       visitDisplayId: UUID
  //     }>(req)
  //
  //     const errors = validationResult(req)
  //     if (!errors.isEmpty()) {
  //       req.flash('errors', errors.array())
  //
  //       if (!visitDisplayId) {
  //         return res.redirect(paths.VISITS.HOME)
  //       }
  //
  //       return res.redirect(`${paths.VISITS.CANCEL_VISIT}/${visitDisplayId}`)
  //     }
  //
  //     if (cancelVisit === 'no') {
  //       return res.redirect(`${paths.VISITS.DETAILS}/${visitDisplayId}`)
  //     }
  //
  //     const { booker, pendingVisitors } = req.session
  //     const { visits } = pendingVisitors!
  //     const visit = visits.find(v => v.visitDisplayId === visitDisplayId)!
  //
  //     // Redirect to 'Past Visits' page, if visit start time has already passed
  //     const nowTimestamp = new Date()
  //     const visitStartTimestamp = new Date(visit.startTimestamp)
  //     if (nowTimestamp > visitStartTimestamp) {
  //       return res.redirect(paths.VISITS.PAST)
  //     }
  //
  //     await this.visitService.cancelVisit({
  //       applicationReference: visit.reference,
  //       actionedBy: booker!.reference,
  //       language: req.language,
  //     })
  //
  //     req.session.visitCancelled = {
  //       hasEmail: !!visit.visitContact?.email,
  //       hasMobile: isMobilePhoneNumber(visit.visitContact?.telephone),
  //     }
  //
      return res.redirect(paths.ADD_VISITOR.CANCEL_CONFIRMATION)
    }
  }

  public validateDisplayId(): ValidationChain[] {
    return [validatePendingVisitorDisplayId]
  }

  public validateCancelChoice(): ValidationChain[] {
    return [
      body('cancelVisit')
        .isIn(['yes', 'no'])
        .withMessage((_value, { req }) => req.t('validation:noAnswerSelected'))
    ]
  }
}
