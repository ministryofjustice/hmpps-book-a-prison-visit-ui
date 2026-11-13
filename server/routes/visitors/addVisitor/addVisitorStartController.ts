import { RequestHandler } from 'express'
import { matchedData, ValidationChain, validationResult } from 'express-validator'
import { UUID } from 'crypto'
import { validatePrisonerDisplayId } from '../validations'
import paths from '../../../constants/paths'
import config from '../../../config'

export default class AddVisitorStartController {
  public view(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      const { prisonerDisplayId } = matchedData<{ prisonerDisplayId: UUID }>(req)

      if (!errors.isEmpty()) {
        return res.redirect(config.features.multiplePrisoners ? paths.PRISONERS : paths.VISITORS)
      }

      delete req.session.addVisitorJourneyResult
      return res.render('pages/visitors/addVisitor/addVisitorStart', { showOLServiceNav: true, prisonerDisplayId })
    }
  }

  public validate(): ValidationChain[] {
    return [validatePrisonerDisplayId]
  }
}
