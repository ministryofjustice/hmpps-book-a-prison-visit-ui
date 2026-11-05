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
        if (!errors.isEmpty()) {
          /// TODO: What do we do with an error here - we probably still want to show confirmation?
        }

        const { prisonerDisplayId } = matchedData<{ prisonerDisplayId: UUID }>(req)
        return res.render('pages/visitors/cancelVisitorRequest/cancelConfirmed', {
          showOLServiceNav: true,
          prisonerDisplayId,
        })
      }

      return res.render('pages/visitors/cancelVisitorRequest/cancelConfirmed', {
        showOLServiceNav: true,
      })
    }
  }

  public validate(): ValidationChain[] {
    return [validatePrisonerDisplayId]
  }
}
