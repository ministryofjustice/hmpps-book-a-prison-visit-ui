import type { RequestHandler } from 'express'
import { ValidationChain, matchedData, body, validationResult } from 'express-validator'
import { VisitService } from '../../../services'
import paths from '../../../constants/paths'
import { isMobilePhoneNumber } from '../../../utils/utils'
import { validateVisitDisplayId } from '../validations'

export default class CancelVisitController {
  public constructor(private readonly visitService: VisitService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { bookedVisits } = req.session

      const errors = validationResult(req)
      if (!errors.isEmpty() || bookedVisits.type !== 'future') {
        return res.redirect(paths.VISITS.HOME)
      }

      const { visitDisplayId } = matchedData<{ visitDisplayId: string }>(req)

      const { visits } = bookedVisits
      const visit = visits.find(v => v.visitDisplayId === visitDisplayId)

      return res.render('pages/visits/cancel/cancel', {
        errors: req.flash('errors'),
        visit,
        visitDisplayId,
        showOLServiceNav: true,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res, next) => {
      const { cancelVisit, visitDisplayId } = matchedData<{
        cancelVisit: 'yes' | 'no'
        visitDisplayId: string
      }>(req)

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())

        if (!visitDisplayId) {
          return res.redirect(paths.VISITS.HOME)
        }

        return res.redirect(`${paths.VISITS.CANCEL_VISIT}/${visitDisplayId}`)
      }

      if (cancelVisit === 'no') {
        return res.redirect(`${paths.VISITS.DETAILS}/${visitDisplayId}`)
      }

      const { booker, bookedVisits } = req.session
      const { visits } = bookedVisits
      const visit = visits.find(v => v.visitDisplayId === visitDisplayId)

      // Redirect to 'Past Visits' page, if visit start time has already passed
      const nowTimestamp = new Date()
      const visitStartTimestamp = new Date(visit.startTimestamp)
      if (nowTimestamp > visitStartTimestamp) {
        return res.redirect(paths.VISITS.PAST)
      }

      await this.visitService.cancelVisit({
        applicationReference: visit.reference,
        actionedBy: booker.reference,
      })

      req.session.visitCancelled = {
        hasEmail: !!visit.visitContact.email,
        hasMobile: isMobilePhoneNumber(visit.visitContact.telephone),
      }

      return res.redirect(paths.VISITS.CANCEL_CONFIRMATION)
    }
  }

  public validateDisplayId(): ValidationChain[] {
    return [validateVisitDisplayId]
  }

  public validateCancelChoice(): ValidationChain[] {
    return [body('cancelVisit').isIn(['yes', 'no']).withMessage('No answer selected'), validateVisitDisplayId]
  }
}
