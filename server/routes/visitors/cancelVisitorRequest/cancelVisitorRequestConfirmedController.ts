import type { RequestHandler } from 'express'
import { matchedData, ValidationChain, validationResult } from 'express-validator'
import { UUID } from 'crypto'
import { validatePrisonerDisplayId } from '../validations'
import config from '../../../config'
import paths from '../../../constants/paths'

export default class CancelVisitorRequestConfirmedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.redirect(config.features.multiplePrisoners ? paths.PRISONERS : paths.VISITORS)
      }

      const { prisonerDisplayId } = matchedData<{ prisonerDisplayId: UUID }>(req)
      return res.render('pages/visitors/cancelVisitorRequest/cancelConfirmed', {
        showOLServiceNav: true,
        prisonerDisplayId,
      })
    }
  }

  public validate(): ValidationChain[] {
    return [validatePrisonerDisplayId]
  }
}
