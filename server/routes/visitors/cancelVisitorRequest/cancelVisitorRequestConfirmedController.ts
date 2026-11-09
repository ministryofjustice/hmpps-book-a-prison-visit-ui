import type { RequestHandler } from 'express'
import { matchedData, ValidationChain, validationResult } from 'express-validator'
import { UUID } from 'crypto'
import { validatePrisonerDisplayId } from '../validations'
import config from '../../../config'

export default class CancelVisitorRequestConfirmedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      if (config.features.multiplePrisoners) {
        const errors = validationResult(req)
        let showLinkNewVisitorButton: boolean = true
        if (!errors.isEmpty()) {
          // Invalid prisoner display ID
          showLinkNewVisitorButton = false
        }

        const { prisonerDisplayId } = matchedData<{ prisonerDisplayId: UUID }>(req)
        return res.render('pages/visitors/cancelVisitorRequest/cancelConfirmed', {
          showOLServiceNav: true,
          prisonerDisplayId,
          showLinkNewVisitorButton,
        })
      }

      return res.render('pages/visitors/cancelVisitorRequest/cancelConfirmed', {
        showOLServiceNav: true,
        showLinkNewVisitorButton: true,
      })
    }
  }

  public validate(): ValidationChain[] {
    return [validatePrisonerDisplayId]
  }
}
