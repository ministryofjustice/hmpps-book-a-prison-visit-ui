import type { RequestHandler } from 'express'
import { ValidationChain, matchedData, body, validationResult } from 'express-validator'
import { type UUID } from 'crypto'
import { SessionData } from 'express-session'
import { BookerService } from '../../../services'
import paths from '../../../constants/paths'
import { validateVisitorRequestDisplayId } from '../validations'
import { getPrisonName } from '../../../utils/utils'
import type { Locale } from '../../../constants/locales'

export default class CancelVisitorRequestController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { visitorRequests } = req.session as SessionData

      const errors = validationResult(req)
      if (!errors.isEmpty() || visitorRequests === undefined) {
        return res.redirect(paths.VISITORS)
      }

      const { visitorRequestDisplayId } = matchedData<{ visitorRequestDisplayId: UUID }>(req)

      const visitorRequest = visitorRequests.find(
        request => request.visitorRequestDisplayId === visitorRequestDisplayId,
      )

      return res.render('pages/visitors/cancelVisitorRequest/cancel', {
        errors: req.flash('errors'),
        visitorRequest,
        visitorRequestDisplayId,
        showOLServiceNav: true,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const { cancelVisitorRequest, visitorRequestDisplayId } = matchedData<{
        cancelVisitorRequest: 'yes' | 'no'
        visitorRequestDisplayId: UUID
      }>(req)

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        if (!visitorRequestDisplayId) {
          return res.redirect(paths.VISITORS)
        }

        req.flash('errors', errors.array())
        return res.redirect(`${paths.CANCEL_VISITOR_REQUEST.CANCEL}/${visitorRequestDisplayId}`)
      }

      const { booker, visitorRequests } = req.session // validation middleware ensures these are defined
      const visitorRequest = visitorRequests!.find(
        request => request.visitorRequestDisplayId === visitorRequestDisplayId,
      )!

      if (cancelVisitorRequest === 'no') {
        const prisonId = booker!.prisoners.find(
          prisoner => prisoner.prisonerNumber === visitorRequest.prisonerId,
        )?.registeredPrisonId
        const prisonName = getPrisonName(prisonId ?? '', res.locals.prisonNames!, req.language as Locale)

        req.flash('messages', {
          variant: 'information',
          title: req.t('visitors:visitors.alert.visitorRequestReview.title'),
          showTitleAsHeading: true,
          text: req.t('visitors:visitors.alert.visitorRequestReview.text', { prisonName }),
        })

        return res.redirect(`${paths.VISITORS}`)
      }

      await this.bookerService.withdrawVisitorRequest({
        bookerReference: booker!.reference,
        requestReference: visitorRequest.reference,
      })

      return res.redirect(paths.CANCEL_VISITOR_REQUEST.CANCEL_CONFIRMATION)
    }
  }

  public validateVisitorRequestDisplayId(): ValidationChain[] {
    return [validateVisitorRequestDisplayId]
  }

  public validateCancelChoice(): ValidationChain[] {
    return [
      body('cancelVisitorRequest')
        .isIn(['yes', 'no'])
        .withMessage((_value, { req }) => req.t('validation:noAnswerSelected')),
    ]
  }
}
