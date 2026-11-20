import { RequestHandler } from 'express'
import { matchedData, ValidationChain, validationResult } from 'express-validator'
import paths from '../../constants/paths'
import { prisonIdValidation } from '../../utils/validations'

export default class PrisonerLocationController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      delete req.session.addPrisonerJourneyResult

      const selectedPrisonId = req.session.addPrisonerJourney?.selectedPrisonId
      const prisonerDetails = req.session.addPrisonerJourney?.prisonerDetails

      req.session.addPrisonerJourney = {
        ...(selectedPrisonId && { selectedPrisonId }),
        ...(prisonerDetails && { prisonerDetails }),
      }

      const formValues = {
        ...(selectedPrisonId && { prisonId: selectedPrisonId }),
      }

      return res.render('pages/addPrisoner/prisonerLocation', {
        showOLServiceNav: true,
        errors: req.flash('errors'),
        formValues,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect(paths.ADD_PRISONER.LOCATION)
      }

      req.session.addPrisonerJourney ??= {}
      const { addPrisonerJourney } = req.session
      const { prisonId } = matchedData<{ prisonId: string }>(req)
      addPrisonerJourney.selectedPrisonId = prisonId

      return res.redirect(paths.ADD_PRISONER.DETAILS)
    }
  }

  public validate(): ValidationChain[] {
    return [prisonIdValidation('validation:prisonSelectRequired')]
  }
}
