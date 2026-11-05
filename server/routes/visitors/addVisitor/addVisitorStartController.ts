import { RequestHandler } from 'express'
import { matchedData, ValidationChain, validationResult } from 'express-validator'
import { UUID } from 'crypto'
import { validatePrisonerDisplayId } from '../validations'
import paths from '../../../constants/paths'
import config from '../../../config'

export default class AddVisitorStartController {
  public view(): RequestHandler {
    return async (req, res) => {
      if (config.features.multiplePrisoners) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          return res.redirect(paths.PRISONERS)
        }

        const booker = req.session.booker!
        const { prisonerDisplayId } = matchedData<{ prisonerDisplayId: UUID }>(req)
        const prisoner = booker.prisoners.find(p => p.prisonerDisplayId === prisonerDisplayId)
        if (!prisoner) {
          return res.redirect(paths.PRISONERS)
        }

        req.session.addVisitorJourney = { prisoner }
      }
      delete req.session.addVisitorJourneyResult
      return res.render('pages/visitors/addVisitor/addVisitorStart', { showOLServiceNav: true })
    }
  }

  public validate(): ValidationChain[] {
    return [validatePrisonerDisplayId]
  }
}
